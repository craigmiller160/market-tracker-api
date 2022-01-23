import { AppRefreshTokenModel } from '../../mongo/models/AppRefreshTokenModel';
import { Request } from 'express';
import { AccessToken } from '../../express/auth/AccessToken';
import { pipe } from 'fp-ts/function';
import * as Option from 'fp-ts/Option';
import * as TaskEither from 'fp-ts/TaskEither';
import * as TaskTry from '@craigmiller160/ts-functions/TaskTry';
import { UnauthorizedError } from '../../error/UnauthorizedError';
import { getEmptyCookie } from './Cookie';
import { ReaderTaskTryT } from '@craigmiller160/ts-functions/types';
import { ExpressDependencies } from '../../express/ExpressDependencies';

const deleteRefreshToken =
	(token: AccessToken): ReaderTaskTryT<ExpressDependencies, unknown> =>
	() =>
		TaskTry.tryCatch(() =>
			// TODO do not do this
			AppRefreshTokenModel.deleteOne({ tokenId: token.jti }).exec()
		);

export const logout =
	(req: Request): ReaderTaskTryT<ExpressDependencies, string> =>
	(dependencies) =>
		pipe(
			Option.fromNullable(req.user as AccessToken | undefined),
			TaskEither.fromOption(
				() =>
					new UnauthorizedError(
						'Should not be able to call /logout without being authenticated'
					)
			),
			TaskEither.chainFirst((token) =>
				deleteRefreshToken(token)(dependencies)
			), // TODO figure out Reader functions to avoid drilling
			TaskEither.chain(() => TaskEither.fromEither(getEmptyCookie()))
		);
