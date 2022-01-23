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
import { pipe } from 'fp-ts/function';
import * as TaskEither from 'fp-ts/TaskEither';
import { logger } from '../../../logger';

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
			logger.error('Error closing session');
			logger.error(ex);
			return ex;
		})
	);

	return postTxnTE;
};

export const findByTokenId: FindByTokenId = (tokenId) =>
	TaskTry.tryCatch(() => AppRefreshTokenModel.find({ tokenId }).exec());
