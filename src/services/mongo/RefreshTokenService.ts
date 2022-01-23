import {
	AppRefreshTokenModel,
	appRefreshTokenToModel
} from '../../mongo/models/AppRefreshTokenModel';
import * as TaskTry from '@craigmiller160/ts-functions/TaskTry';
import * as TE from 'fp-ts/TaskEither';
import { pipe } from 'fp-ts/function';
import { logger } from '../../logger';
import { AppRefreshToken } from '../../data/modelTypes/AppRefreshToken';

const removeExistingAndInsertToken = async (
	refreshToken: AppRefreshToken,
	existingTokenId?: string
): Promise<void> => {
	await AppRefreshTokenModel.deleteOne({
		tokenId: existingTokenId ?? refreshToken.tokenId
	}).exec();
	await appRefreshTokenToModel(refreshToken).save();
};

export const saveRefreshToken = (
	refreshToken: AppRefreshToken,
	existingTokenId?: string
): TE.TaskEither<Error, unknown> => {
	const sessionTE = TaskTry.tryCatch(() =>
		AppRefreshTokenModel.startSession()
	);

	const postTxnTE = pipe(
		sessionTE,
		TE.chainFirst((session) =>
			TaskTry.tryCatch(() =>
				session.withTransaction(() =>
					removeExistingAndInsertToken(refreshToken, existingTokenId)
				)
			)
		)
	);

	pipe(
		sessionTE,
		TE.chain((session) => TaskTry.tryCatch(() => session.endSession())),
		TE.mapLeft((ex) => {
			logger.error('Error closing session');
			logger.error(ex);
			return ex;
		})
	);

	return postTxnTE;
};
