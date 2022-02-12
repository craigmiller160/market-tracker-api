import {
	DeleteByTokenId,
	FindByTokenId,
	SaveRefreshToken
} from '../AppRefreshTokenRepository';
import * as TaskTry from '@craigmiller160/ts-functions/TaskTry';
import {
	AppRefreshTokenModel,
	appRefreshTokenToModel
} from '../../../mongo/models/AppRefreshTokenModel';
import { AppRefreshToken } from '../../modelTypes/AppRefreshToken';
import { constVoid, pipe } from 'fp-ts/function';
import * as TaskEither from 'fp-ts/TaskEither';
import { logger, logger2 } from '../../../logger';
import { ClientSession } from 'mongoose';
import { TaskT } from '@craigmiller160/ts-functions/types';
import * as Task from 'fp-ts/Task';

export const deleteByTokenId: DeleteByTokenId = (tokenId) =>
	TaskTry.tryCatch(() => AppRefreshTokenModel.deleteOne({ tokenId }).exec());

const removeExistingAndInsertToken = async (
	refreshToken: AppRefreshToken,
	existingTokenId?: string
): Promise<void> => {
	await AppRefreshTokenModel.deleteOne({
		tokenId: existingTokenId ?? refreshToken.tokenId
	}).exec();
	await appRefreshTokenToModel(refreshToken).save();
};

const closeSession = (session: ClientSession): TaskT<void> =>
	pipe(
		TaskTry.tryCatch(() => session.endSession()),
		TaskEither.fold(
			(ex) =>
				pipe(
					logger.errorWithStack('Error closing session', ex),
					Task.fromIO
				),
			constVoid
		)
	);

export const saveRefreshToken: SaveRefreshToken = (
	refreshToken,
	existingTokenId
) => {
	const sessionTE = TaskTry.tryCatch(() =>
		AppRefreshTokenModel.startSession()
	);

	const postTxnTE = pipe(
		sessionTE,
		TaskEither.chainFirst((session) =>
			TaskTry.tryCatch(() =>
				session.withTransaction(() =>
					removeExistingAndInsertToken(refreshToken, existingTokenId)
				)
			)
		)
	);

	pipe(
		sessionTE,
		TaskEither.chain((session) =>
			TaskTry.tryCatch(() => session.endSession())
		),
		TaskEither.mapLeft((ex) => {
			// TODO not sure how to address this
			logger2.error('Error closing session');
			logger2.error(ex);
			return ex;
		})
	);

	return postTxnTE;
};

export const findByTokenId: FindByTokenId = (tokenId) =>
	TaskTry.tryCatch(() => AppRefreshTokenModel.find({ tokenId }).exec());
