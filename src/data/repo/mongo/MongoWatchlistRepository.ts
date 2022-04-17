import {
	AddInvestmentForUser,
	CreateWatchlistForUser,
	FindWatchlistsForUser,
	GetAllNamesForUser,
	RemoveInvestmentForUser,
	RemoveWatchlistForUser,
	RenameWatchlistForUser,
	SaveWatchlistsForUser
} from '../WatchlistRepository';
import { logger } from '../../../logger';
import * as TaskTry from '@craigmiller160/ts-functions/TaskTry';
import {
	WatchlistModel,
	WatchlistModelInstanceType,
	watchlistToModel
} from '../../../mongo/models/WatchlistModel';
import { constVoid, pipe } from 'fp-ts/function';
import * as RArray from 'fp-ts/ReadonlyArray';
import * as TaskEither from 'fp-ts/TaskEither';
import { closeSessionAfterTransaction } from '../../../mongo/Session';
import { match } from 'ts-pattern';
import * as Option from 'fp-ts/Option';
import { BadRequestError } from '../../../error/BadRequestError';

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

export const getAllNamesForUser: GetAllNamesForUser = (userId) =>
	pipe(
		TaskTry.tryCatch(() =>
			WatchlistModel.find({ userId }).select('watchlistName').exec()
		),
		TaskEither.map(RArray.map((value): string => value.watchlistName))
	);

export const addInvestmentForUser: AddInvestmentForUser = (
	userId,
	watchlistName,
	type,
	symbol
) => {
	const filter = {
		watchlistName,
		userId
	};
	return pipe(
		TaskTry.tryCatch(() =>
			WatchlistModel.updateOne(filter, {
				$push: match(type)
					.with('stock', () => ({
						stocks: [{ symbol }]
					}))
					.otherwise(() => ({
						cryptos: [{ symbol }]
					}))
			}).exec()
		),
		TaskTry.chainTryCatch(() => WatchlistModel.findOne(filter).exec()),
		TaskEither.map(Option.fromNullable)
	);
};

export const removeInvestmentForUser: RemoveInvestmentForUser = (
	userId,
	watchlistName,
	type,
	symbol
) => {
	const filter = {
		watchlistName,
		userId
	};
	return pipe(
		TaskTry.tryCatch(() =>
			WatchlistModel.updateOne(filter, {
				$pull: match(type)
					.with('stock', () => ({
						stocks: {
							symbol
						}
					}))
					.otherwise(() => ({
						cryptos: {
							symbol
						}
					}))
			}).exec()
		),
		TaskTry.chainTryCatch(() => WatchlistModel.findOne(filter).exec()),
		TaskEither.map(Option.fromNullable)
	);
};

export const removeWatchlistForUser: RemoveWatchlistForUser = (
	userId,
	watchlistName
) =>
	pipe(
		TaskTry.tryCatch(() =>
			WatchlistModel.deleteOne({
				watchlistName,
				userId
			}).exec()
		),
		TaskEither.map((result) => {
			if (result.deletedCount > 0) {
				return Option.of(result.deletedCount);
			}
			return Option.none;
		})
	);

export const renameWatchlistForUser: RenameWatchlistForUser = (
	userId,
	oldWatchlistName,
	newWatchlistName
) =>
	pipe(
		TaskTry.tryCatch(() =>
			WatchlistModel.updateOne(
				{
					watchlistName: oldWatchlistName
				},
				{
					$set: {
						watchlistName: newWatchlistName
					}
				}
			).exec()
		),
		TaskEither.chain((updateResult) =>
			match(updateResult)
				.with({ modifiedCount: 1 }, () => TaskEither.right(constVoid()))
				.otherwise(() =>
					TaskEither.left<Error>(
						new BadRequestError(
							`No match found for watchlist ${oldWatchlistName}`
						)
					)
				)
		)
	);
