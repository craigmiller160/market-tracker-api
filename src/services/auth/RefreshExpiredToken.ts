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
import {
	AppRefreshToken,
	AppRefreshTokenModel
} from '../../mongo/models/AppRefreshTokenModel';
import { sendTokenRequest } from './AuthServerRequest';
import { TokenResponse } from '../../types/TokenResponse';
import { saveRefreshToken } from '../mongo/RefreshTokenService';
import { createTokenCookie } from './Cookie';
import { logDebug } from '../../logger';

interface RefreshBody {
	readonly grant_type: 'refresh_token';
	readonly refresh_token: string;
}

const decodeToken = (token: string): Try.Try<AccessToken> =>
	Try.tryCatch(() => JWT.decode(token) as AccessToken);

const getTokenId = (token: AccessToken): string => token.jti;

const findRefreshTokenById = (
	tokenId: string
): TaskTry.TaskTry<AppRefreshToken> =>
	pipe(
		TaskTry.tryCatch(() => AppRefreshTokenModel.find({ tokenId }).exec()),
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
	tokenResponse: TokenResponse
): TaskTry.TaskTry<unknown> => {
	const refreshToken: AppRefreshToken = {
		tokenId: tokenResponse.tokenId,
		refreshToken: tokenResponse.refreshToken
	};
	return saveRefreshToken(refreshToken);
};

const getRefreshToken: (token: string | null) => TaskTry.TaskTry<string> = flow(
	Option.fromNullable,
	Either.fromOption(() => new UnauthorizedError('No token to refresh')),
	Either.chain(decodeToken),
	Either.map(getTokenId),
	TaskEither.fromEither,
	TaskEither.chain(findRefreshTokenById),
	TaskEither.map((_) => _.refreshToken)
);

const getRefreshBody = (refreshToken: string): RefreshBody => ({
	grant_type: 'refresh_token',
	refresh_token: refreshToken
});

export const refreshExpiredToken = (
	token: string | null
): TaskTry.TaskTry<string> => {
	return pipe(
		logDebug('Attempting to refresh expired token'), // TODO do I want the log here, or elsewhere?
		TaskEither.fromIO,
		TaskEither.chain(() => getRefreshToken(token)),
		TaskEither.map(getRefreshBody),
		TaskEither.chain(sendTokenRequest),
		TaskEither.chainFirst(handleRefreshToken),
		TaskEither.chain((_) =>
			TaskEither.fromEither(createTokenCookie(_.accessToken))
		)
	);
};
