import {
	CreateWatchlistForUser,
	FindWatchlistsForUser,
	GetAllNamesForUser,
	SaveWatchlistsForUser
} from '../WatchlistRepository';
import { logger } from '../../../logger';
import * as TaskTry from '@craigmiller160/ts-functions/TaskTry';
import {
	WatchlistModel,
	WatchlistModelInstanceType,
	watchlistToModel
} from '../../../mongo/models/WatchlistModel';
import { pipe } from 'fp-ts/function';
import * as RArray from 'fp-ts/ReadonlyArray';
import * as TaskEither from 'fp-ts/TaskEither';
import { closeSessionAfterTransaction } from '../../../mongo/Session';

export const findWatchlistsForUser: FindWatchlistsForUser = (userId) =>
	pipe(
		logger.debug(`Finding watchlists for user. ID: ${userId}`),
		TaskEither.rightIO,
		TaskTry.chainTryCatch(() => WatchlistModel.find({ userId }).exec())
	);

const replaceWatchlistsForUser = async (
	userId: number,
	watchlistModels: ReadonlyArray<WatchlistModelInstanceType>
): Promise<void> => {
	await WatchlistModel.deleteMany({ userId }).exec();
	await WatchlistModel.insertMany(watchlistModels);
};

export const createWatchlistForUser: CreateWatchlistForUser = (
	userId,
	watchlist
) => {
	const watchlistModel = new WatchlistModel({
		...watchlist,
		userId
	});
	return TaskTry.tryCatch(() => watchlistModel.save());
};

export const saveWatchlistsForUser: SaveWatchlistsForUser = (
	userId,
	watchlists
) => {
	const watchlistModels = pipe(
		watchlists,
		RArray.map((_) =>
			watchlistToModel({
				..._,
				userId
			})
		)
	);

	return pipe(
		logger.debug(`Saving watchlists for user. ID: ${userId}`),
		TaskEither.rightIO,
		TaskTry.chainTryCatch(() => WatchlistModel.startSession()),
		TaskEither.chain((session) =>
			pipe(
				TaskTry.tryCatch(() =>
					session.withTransaction(() =>
						replaceWatchlistsForUser(userId, watchlistModels)
					)
				),
				closeSessionAfterTransaction(session)
			)
		)
	);
};

export const getAllNamesForUser: GetAllNamesForUser = (userId) => {
	pipe(
		TaskTry.tryCatch(() =>
			WatchlistModel.find({ userId }).select('name').exec()
		),
		TaskEither.map((values) => {
			// TODO map array
			return values;
		})
	);

	throw new Error();
};
