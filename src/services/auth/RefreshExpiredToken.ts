import * as JWT from 'jsonwebtoken';
import { AccessToken } from '../../express/TokenValidation';
import { flow, pipe } from 'fp-ts/function';
import * as Option from 'fp-ts/Option';
import * as Either from 'fp-ts/Either';
import TaskEither from 'fp-ts/TaskEither';
import * as Try from '@craigmiller160/ts-functions/Try';
import * as TaskTry from '@craigmiller160/ts-functions/TaskTry';
import * as RArr from 'fp-ts/ReadonlyArray';
import { UnauthorizedError } from '../../error/UnauthorizedError';
import {
	AppRefreshToken,
	AppRefreshTokenModel
} from '../../mongo/models/AppRefreshTokenModel';

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

const getRefreshToken: (token: string | null) => TaskTry.TaskTry<string> = flow(
	Option.fromNullable,
	Either.fromOption(() => new UnauthorizedError('No token to refresh')),
	Either.chain(decodeToken),
	Either.map(getTokenId),
	TaskEither.fromEither,
	TaskEither.chain(findRefreshTokenById),
	TaskEither.map((_) => _.refreshToken)
);

export const refreshExpiredToken: (token: string | null) => unknown =
	flow(getRefreshToken);
