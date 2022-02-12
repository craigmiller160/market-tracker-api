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
import { logger } from '../../../logger';
import { ClientSession } from 'mongoose';
import { TaskT } from '@craigmiller160/ts-functions/types';
import * as Task from 'fp-ts/Task';
import * as Either from 'fp-ts/Either';

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
			() => async () => constVoid()
		)
	);

export const saveRefreshToken: SaveRefreshToken = (
	refreshToken,
	existingTokenId
) =>
	pipe(
		TaskTry.tryCatch(() => AppRefreshTokenModel.startSession()),
		TaskEither.chain((session) =>
			pipe(
				TaskTry.tryCatch(() =>
					session.withTransaction(() =>
						removeExistingAndInsertToken(
							refreshToken,
							existingTokenId
						)
					)
				),
				TaskEither.fold(
					(ex) =>
						pipe(
							closeSession(session),
							Task.map(() => Either.left(ex))
						),
					() => async () => Either.right(constVoid())
				)
			)
		)
	);

export const findByTokenId: FindByTokenId = (tokenId) =>
	TaskTry.tryCatch(() => AppRefreshTokenModel.find({ tokenId }).exec());
