import {
	AppRefreshToken,
	AppRefreshTokenModel,
	appRefreshTokenToModel
} from '../../mongo/models/AppRefreshTokenModel';
import * as TEU from '../../function/TaskEitherUtils';
import * as TE from 'fp-ts/TaskEither';
import { pipe } from 'fp-ts/function';
import { logger } from '../../logger';

const removeExistingAndInsertToken = async (
	refreshToken: AppRefreshToken
): Promise<void> => {
	await AppRefreshTokenModel.deleteOne({
		tokenId: refreshToken.tokenId
	}).exec();
	await appRefreshTokenToModel(refreshToken).save();
};

export const saveRefreshToken = (
	refreshToken: AppRefreshToken
): TE.TaskEither<Error, unknown> => {
	const sessionTE = TEU.tryCatch(() => AppRefreshTokenModel.startSession());

	const postTxnTE = pipe(
		sessionTE,
		TE.chainFirst((session) =>
			TEU.tryCatch(() =>
				session.withTransaction(() =>
					removeExistingAndInsertToken(refreshToken)
				)
			)
		)
	);

	pipe(
		sessionTE,
		TE.chain((session) => TEU.tryCatch(() => session.endSession())),
		TE.mapLeft((ex) => {
			logger.error('Error closing session');
			logger.error(ex);
			return ex;
		})
	);

	return postTxnTE;
};
