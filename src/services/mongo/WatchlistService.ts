import * as TaskTry from '@craigmiller160/ts-functions/TaskTry';
import * as A from 'fp-ts/Array';
import * as TE from 'fp-ts/TaskEither';
import {
	WatchlistModel,
	WatchlistModelInstanceType,
	watchlistToModel
} from '../../mongo/models/WatchlistModel';
import { pipe } from 'fp-ts/function';
import { logAndReturn, logger } from '../../logger';
import { Watchlist } from '../../data/modelTypes/Watchlist';

// TODO delete this

export const findWatchlistsForUser = (
	userId: number
): TaskTry.TaskTry<Watchlist[]> => {
	logger.info(`Finding watchlists for user. ID: ${userId}`);
	return TaskTry.tryCatch(() => WatchlistModel.find({ userId }).exec());
};

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
	logger.info(`Saving watchlists for user. ID: ${userId}`);
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
		TE.mapLeft(logAndReturn('error', 'Error closing session'))
	);

	return postTxnTE;
};
