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
import { closeSessionAfterTransaction } from '../../../mongo/Session';

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
				closeSessionAfterTransaction(session)
			)
		)
	);

export const findByTokenId: FindByTokenId = (tokenId) =>
	TaskTry.tryCatch(() => AppRefreshTokenModel.find({ tokenId }).exec());
