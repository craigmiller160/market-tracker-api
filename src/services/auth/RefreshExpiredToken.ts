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
import { logger2 } from '../../logger';
import { AppRefreshToken } from '../../data/modelTypes/AppRefreshToken';
import { ReaderTaskTryT, TryT } from '@craigmiller160/ts-functions/types';
import * as ReaderTaskEither from 'fp-ts/ReaderTaskEither';
import { ExpressDependencies } from '../../express/ExpressDependencies';

interface RefreshBody {
	readonly grant_type: 'refresh_token';
	readonly refresh_token: string;
}

interface RefreshTokenAndId {
	readonly existingTokenId: string;
	readonly refreshToken: AppRefreshToken;
}

const decodeToken = (token: string): TryT<AccessToken> =>
	Try.tryCatch(() => JWT.decode(token) as AccessToken);

const getTokenId = (token: AccessToken): string => token.jti;

const findRefreshTokenById =
	(tokenId: string): ReaderTaskTryT<ExpressDependencies, AppRefreshToken> =>
	({ appRefreshTokenRepository }) =>
		pipe(
			appRefreshTokenRepository.findByTokenId(tokenId),
			TaskEither.map(RArr.head),
			TaskEither.chain(
				Option.fold<AppRefreshToken, TaskTry.TaskTry<AppRefreshToken>>(
					() =>
						TaskEither.left(
							new UnauthorizedError(
								'Unable to find refresh token'
							)
						),
					(_) => TaskEither.right(_)
				)
			)
		);

const handleRefreshToken =
	(
		existingTokenId: string,
		tokenResponse: TokenResponse
	): ReaderTaskTryT<ExpressDependencies, unknown> =>
	({ appRefreshTokenRepository }) => {
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
) => ReaderTaskTryT<ExpressDependencies, RefreshTokenAndId> = flow(
	Option.fromNullable,
	Either.fromOption(() => new UnauthorizedError('No token to refresh')),
	Either.chain(decodeToken),
	Either.map(getTokenId),
	ReaderTaskEither.fromEither,
	ReaderTaskEither.bindTo('existingTokenId'),
	ReaderTaskEither.bind('refreshToken', ({ existingTokenId }) =>
		findRefreshTokenById(existingTokenId)
	)
);

const getRefreshBody = (refreshToken: string): RefreshBody => ({
	grant_type: 'refresh_token',
	refresh_token: refreshToken
});

export const refreshExpiredToken = (
	token: string | null
): ReaderTaskTryT<ExpressDependencies, string> => {
	logger2.debug('Attempting to refresh expired token');
	return pipe(
		getRefreshToken(token),
		ReaderTaskEither.bindTo('tokenAndId'),
		ReaderTaskEither.bind(
			'refreshBody',
			({ tokenAndId: { refreshToken } }) =>
				ReaderTaskEither.right(
					getRefreshBody(refreshToken.refreshToken)
				)
		),
		ReaderTaskEither.bind('tokenResponse', ({ refreshBody }) =>
			ReaderTaskEither.fromTaskEither(sendTokenRequest(refreshBody))
		),
		ReaderTaskEither.chainFirst(
			({ tokenResponse, tokenAndId: { existingTokenId } }) =>
				handleRefreshToken(existingTokenId, tokenResponse)
		),
		ReaderTaskEither.chain(({ tokenResponse: { accessToken } }) =>
			ReaderTaskEither.fromIOEither(createTokenCookie(accessToken))
		)
	);
};
