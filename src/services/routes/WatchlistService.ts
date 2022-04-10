import { ReaderT } from '@craigmiller160/ts-functions/types';
import { ExpressRouteDependencies } from '../../express/ExpressDependencies';
import { AccessToken } from '../../express/auth/AccessToken';
import { identity, pipe } from 'fp-ts/function';
import * as TaskEither from 'fp-ts/TaskEither';
import { NextFunction, Request, Response } from 'express';
import { errorTask } from '../../function/Route';
import { TaskRoute } from '../../express/Route';
import * as Reader from 'fp-ts/Reader';
import {
	InvestmentType,
	WatchlistRepository
} from '../../data/repo/WatchlistRepository';
import { WatchlistInput } from '../../data/modelTypes/Watchlist';
import { BadRequestError } from '../../error/BadRequestError';

interface AddInvestmentParams {
	readonly watchlistName: string;
	readonly type: InvestmentType;
	readonly symbol: string;
}

export const addInvestment: ReaderT<ExpressRouteDependencies, TaskRoute> =
	({ watchlistRepository }) =>
	(req: Request, res: Response, next: NextFunction) => {
		const token = req.user as AccessToken;
		const params = req.params as unknown as AddInvestmentParams;
		return pipe(
			watchlistRepository.addInvestmentForUser(
				token.userId,
				params.watchlistName,
				params.type,
				params.symbol
			),
			TaskEither.chainOptionK(
				(): Error =>
					new BadRequestError(
						`No watchlist for name: ${params.watchlistName}`
					)
			)(identity),
			TaskEither.fold(errorTask(next), (_) => async () => {
				res.json(_);
			})
		);
	};

export const getAllNames: ReaderT<ExpressRouteDependencies, TaskRoute> = pipe(
	Reader.asks<ExpressRouteDependencies, WatchlistRepository>(
		({ watchlistRepository }) => watchlistRepository
	),
	Reader.map(
		(watchlistRepository) =>
			(req: Request, res: Response, next: NextFunction) => {
				const token = req.user as AccessToken;
				return pipe(
					watchlistRepository.getAllNamesForUser(token.userId),
					TaskEither.fold(errorTask(next), (_) => async () => {
						res.json(_);
					})
				);
			}
	)
);

export const createNewWatchlist: ReaderT<ExpressRouteDependencies, TaskRoute> =
	pipe(
		Reader.asks<ExpressRouteDependencies, WatchlistRepository>(
			({ watchlistRepository }) => watchlistRepository
		),
		Reader.map(
			(watchlistRepository) =>
				(req: Request, res: Response, next: NextFunction) => {
					const token = req.user as AccessToken;
					return pipe(
						watchlistRepository.createWatchlistForUser(
							token.userId,
							req.body as WatchlistInput
						),
						TaskEither.fold(errorTask(next), (_) => async () => {
							res.json(_);
						})
					);
				}
		)
	);

export const getWatchlistsByUser: ReaderT<ExpressRouteDependencies, TaskRoute> =
	pipe(
		Reader.asks<ExpressRouteDependencies, WatchlistRepository>(
			({ watchlistRepository }) => watchlistRepository
		),
		Reader.map(
			(watchlistRepository) =>
				(req: Request, res: Response, next: NextFunction) => {
					const token = req.user as AccessToken;
					return pipe(
						watchlistRepository.findWatchlistsForUser(token.userId),
						TaskEither.fold(errorTask(next), (_) => async () => {
							res.json(_);
						})
					);
				}
		)
	);

export const saveWatchlistsForUser: ReaderT<
	ExpressRouteDependencies,
	TaskRoute
> = pipe(
	Reader.asks<ExpressRouteDependencies, WatchlistRepository>(
		({ watchlistRepository }) => watchlistRepository
	),
	Reader.map(
		(watchlistRepository) =>
			(req: Request, res: Response, next: NextFunction) => {
				const token = req.user as AccessToken;
				return pipe(
					watchlistRepository.saveWatchlistsForUser(
						token.userId,
						req.body
					),
					TaskEither.chain(() =>
						watchlistRepository.findWatchlistsForUser(token.userId)
					),
					TaskEither.fold(errorTask(next), (_) => async () => {
						res.json(_);
					})
				);
			}
	)
);
