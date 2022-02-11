import {
	FindWatchlistsForUser,
	SaveWatchlistsForUser
} from '../WatchlistRepository';
import { logAndReturn, logger2 } from '../../../logger';
import * as TaskTry from '@craigmiller160/ts-functions/TaskTry';
import {
	WatchlistModel,
	WatchlistModelInstanceType,
	watchlistToModel
} from '../../../mongo/models/WatchlistModel';
import { pipe } from 'fp-ts/function';
import * as RArray from 'fp-ts/ReadonlyArray';
import * as TaskEither from 'fp-ts/TaskEither';

export const findWatchlistsForUser: FindWatchlistsForUser = (userId) => {
	logger2.info(`Finding watchlists for user. ID: ${userId}`);
	return TaskTry.tryCatch(() => WatchlistModel.find({ userId }).exec());
};

const replaceWatchlistsForUser = async (
	userId: number,
	watchlistModels: ReadonlyArray<WatchlistModelInstanceType>
): Promise<void> => {
	await WatchlistModel.deleteMany({ userId }).exec();
	await WatchlistModel.insertMany(watchlistModels);
};

export const saveWatchlistsForUser: SaveWatchlistsForUser = (
	userId,
	watchlists
) => {
	logger2.info(`Saving watchlists for user. ID: ${userId}`);
	const watchlistModels = pipe(
		watchlists,
		RArray.map((_) =>
			watchlistToModel({
				..._,
				userId
			})
		)
	);

	const sessionTE = TaskTry.tryCatch(() => WatchlistModel.startSession());

	const postTxnTE = pipe(
		sessionTE,
		TaskEither.chainFirst((session) =>
			TaskTry.tryCatch(() =>
				session.withTransaction(() =>
					replaceWatchlistsForUser(userId, watchlistModels)
				)
			)
		)
	);

	pipe(
		sessionTE,
		TaskEither.chain((session) =>
			TaskTry.tryCatch(() => session.endSession())
		),
		TaskEither.mapLeft(logAndReturn('error', 'Error closing session'))
	);

	return postTxnTE;
};
