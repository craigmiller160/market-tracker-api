import { ReaderTaskT } from '@craigmiller160/ts-functions/types';
import { ExpressDependencies } from '../../express/ExpressDependencies';
import { AccessToken } from '../../express/auth/AccessToken';
import { pipe } from 'fp-ts/function';
import * as TaskEither from 'fp-ts/TaskEither';
import { NextFunction, Request, Response } from 'express';
import { Watchlist } from '../../data/modelTypes/Watchlist';
import { errorTask } from '../../function/Route';

export const getWatchlistsByUser =
	(
		req: Request,
		res: Response,
		next: NextFunction
	): ReaderTaskT<ExpressDependencies, unknown> =>
	({ watchlistRepository }) => {
		const token = req.user as AccessToken;
		return pipe(
			watchlistRepository.findWatchlistsForUser(token.userId),
			TaskEither.fold(errorTask(next), (_) => async () => {
				res.json(_);
			})
		);
	};

export const saveWatchlistsByUser =
	(
		req: Request<unknown, unknown, ReadonlyArray<Watchlist>>,
		res: Response,
		next: NextFunction
	): ReaderTaskT<ExpressDependencies, unknown> =>
	({ watchlistRepository }) => {
		const token = req.user as AccessToken;
		return pipe(
			watchlistRepository.saveWatchlistsForUser(token.userId, req.body),
			TaskEither.chain(() =>
				watchlistRepository.findWatchlistsForUser(token.userId)
			),
			TaskEither.fold(errorTask(next), (_) => async () => {
				res.json(_);
			})
		);
	};
