import * as TaskTry from '@craigmiller160/ts-functions/TaskTry';
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
): TaskTry.TaskTry<Watchlist[]> =>
	TaskTry.tryCatch(() => WatchlistModel.find({ userId }).exec());

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
): TaskTry.TaskTry<unknown> => {
	const watchlistModels = pipe(
		watchlists,
		A.map((_) =>
			watchlistToModel({
				..._,
				userId
			})
		)
	);

	const sessionTE = TaskTry.tryCatch(() => WatchlistModel.startSession());

	const postTxnTE = pipe(
		sessionTE,
		TE.chainFirst((session) =>
			TaskTry.tryCatch(() =>
				session.withTransaction(() =>
					replaceWatchlistsForUser(userId, watchlistModels)
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
