import { ReaderT } from '@craigmiller160/ts-functions/types';
import { ExpressRouteDependencies } from '../../express/ExpressDependencies';
import { AccessToken } from '../../express/auth/AccessToken';
import { pipe } from 'fp-ts/function';
import * as TaskEither from 'fp-ts/TaskEither';
import { NextFunction, Request, Response } from 'express';
import { errorTask } from '../../function/Route';
import { TaskRoute } from '../../express/Route';
import * as Reader from 'fp-ts/Reader';
import { WatchlistRepository } from '../../data/repo/WatchlistRepository';

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
