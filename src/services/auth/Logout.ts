import { AppRefreshTokenModel } from '../../mongo/models/AppRefreshTokenModel';
import { Request } from 'express';
import { AccessToken } from '../../express/auth/AccessToken';
import { pipe } from 'fp-ts/function';
import * as O from 'fp-ts/Option';
import * as TE from 'fp-ts/TaskEither';
import * as TaskTry from '@craigmiller160/ts-functions/TaskTry';
import { UnauthorizedError } from '../../error/UnauthorizedError';
import { getEmptyCookie } from './Cookie';

const deleteRefreshToken = (
	token: AccessToken
): TE.TaskEither<Error, unknown> =>
	TaskTry.tryCatch(() =>
		AppRefreshTokenModel.deleteOne({ tokenId: token.jti }).exec()
	);

export const logout = (req: Request): TE.TaskEither<Error, string> =>
	pipe(
		O.fromNullable(req.user as AccessToken | undefined),
		TE.fromOption(
			() =>
				new UnauthorizedError(
					'Should not be able to call /logout without being authenticated'
				)
		),
		TE.chainFirst(deleteRefreshToken),
		TE.chain(() => TE.fromEither(getEmptyCookie()))
	);
