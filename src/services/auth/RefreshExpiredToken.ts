import * as JWT from 'jsonwebtoken';
import { AccessToken } from '../../express/auth/AccessToken';
import { flow, pipe } from 'fp-ts/function';
import * as Option from 'fp-ts/Option';
import * as Either from 'fp-ts/Either';
import * as TaskEither from 'fp-ts/TaskEither';
import * as Try from '@craigmiller160/ts-functions/Try';
import * as TaskTry from '@craigmiller160/ts-functions/TaskTry';
import * as RArr from 'fp-ts/ReadonlyArray';
import { UnauthorizedError } from '../../error/UnauthorizedError';
import { sendTokenRequest } from './AuthServerRequest';
import { TokenResponse } from '../../types/TokenResponse';
import { createTokenCookie } from './Cookie';
import { logger } from '../../logger';
import { AppRefreshToken } from '../../data/modelTypes/AppRefreshToken';
import { appRefreshTokenRepository } from '../../data/repo';

interface RefreshBody {
	readonly grant_type: 'refresh_token';
	readonly refresh_token: string;
}

interface RefreshTokenAndId {
	readonly existingTokenId: string;
	readonly refreshToken: AppRefreshToken;
}

const decodeToken = (token: string): Try.Try<AccessToken> =>
	Try.tryCatch(() => JWT.decode(token) as AccessToken);

const getTokenId = (token: AccessToken): string => token.jti;

const findRefreshTokenById = (
	tokenId: string
): TaskTry.TaskTry<AppRefreshToken> =>
	pipe(
		appRefreshTokenRepository.findByTokenId(tokenId),
		TaskEither.map(RArr.head),
		TaskEither.chain(
			Option.fold<AppRefreshToken, TaskTry.TaskTry<AppRefreshToken>>(
				() =>
					TaskEither.left(
						new UnauthorizedError('Unable to find refresh token')
					),
				(_) => TaskEither.right(_)
			)
		)
	);

const handleRefreshToken = (
	existingTokenId: string,
	tokenResponse: TokenResponse
): TaskTry.TaskTry<unknown> => {
	const refreshToken: AppRefreshToken = {
		tokenId: tokenResponse.tokenId,
		refreshToken: tokenResponse.refreshToken
	};
	return appRefreshTokenRepository.saveRefreshToken(
		refreshToken,
		existingTokenId
	);
};

const getRefreshToken: (
	token: string | null
) => TaskTry.TaskTry<RefreshTokenAndId> = flow(
	Option.fromNullable,
	Either.fromOption(() => new UnauthorizedError('No token to refresh')),
	Either.chain(decodeToken),
	Either.map(getTokenId),
	TaskEither.fromEither,
	TaskEither.bindTo('existingTokenId'),
	TaskEither.bind('refreshToken', ({ existingTokenId }) =>
		findRefreshTokenById(existingTokenId)
	)
);

const getRefreshBody = (refreshToken: string): RefreshBody => ({
	grant_type: 'refresh_token',
	refresh_token: refreshToken
});

export const refreshExpiredToken = (
	token: string | null
): TaskTry.TaskTry<string> => {
	logger.debug('Attempting to refresh expired token');
	return pipe(
		getRefreshToken(token),
		TaskEither.bindTo('tokenAndId'),
		TaskEither.bind('refreshBody', ({ tokenAndId: { refreshToken } }) =>
			TaskEither.right(getRefreshBody(refreshToken.refreshToken))
		),
		TaskEither.bind('tokenResponse', ({ refreshBody }) =>
			sendTokenRequest(refreshBody)
		),
		TaskEither.chainFirst(
			({ tokenResponse, tokenAndId: { existingTokenId } }) =>
				handleRefreshToken(existingTokenId, tokenResponse)
		),
		TaskEither.chain(({ tokenResponse: { accessToken } }) =>
			TaskEither.fromEither(createTokenCookie(accessToken))
		)
	);
};
