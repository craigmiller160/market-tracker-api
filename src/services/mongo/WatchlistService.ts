import * as TEU from '../../function/TaskEitherUtils';
import * as A from 'fp-ts/Array';
import * as TE from 'fp-ts/TaskEither';
import {
	Watchlist,
	WatchlistModel,
	WatchlistModelInstanceType,
	watchlistToModel
} from '../../mongo/models/WatchlistModel';
import { pipe } from 'fp-ts/function';
import { logger } from '../../logger';

export const findWatchlistsForUser = (
	userId: number
): TEU.TaskEither<Watchlist[]> =>
	TEU.tryCatch(() => WatchlistModel.find({ userId }).exec());

const replaceWatchlistsForUser = async (
	userId: number,
	watchlistModels: WatchlistModelInstanceType[]
): Promise<void> => {
	await WatchlistModel.deleteMany({ userId }).exec();
	await WatchlistModel.insertMany(watchlistModels);
};

export const saveWatchlistsForUser = (
	userId: number,
	watchlists: Watchlist[]
): TEU.TaskEither<unknown> => {
	const watchlistModels = pipe(
		watchlists,
		A.map((_) =>
			watchlistToModel({
				..._,
				userId
			})
		)
	);

	const sessionTE = TEU.tryCatch(() => WatchlistModel.startSession());

	const postTxnTE = pipe(
		sessionTE,
		TE.chainFirst((session) =>
			TEU.tryCatch(() =>
				session.withTransaction(() =>
					replaceWatchlistsForUser(userId, watchlistModels)
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
