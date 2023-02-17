import { ReaderT } from '@craigmiller160/ts-functions/types';
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
import { getUserId, KeycloakToken } from '../../keycloak/KeycloakToken';
import { ExpressDependencies } from '../../express/ExpressDependencies';

interface ModifyInvestmentParams {
	readonly watchlistName: string;
	readonly type: InvestmentType;
	readonly symbol: string;
}

interface RemoveParams {
	readonly watchlistName: string;
}

interface RenameParams {
	readonly oldWatchlistName: string;
	readonly newWatchlistName: string;
}

export const removeWatchlist: ReaderT<ExpressDependencies, TaskRoute> =
	({ watchlistRepository }) =>
	(req: Request, res: Response, next: NextFunction) => {
		const token = req.user as KeycloakToken;
		const userId = getUserId(token);
		const params = req.params as unknown as RemoveParams;
		return pipe(
			watchlistRepository.removeWatchlistForUser(
				userId,
				params.watchlistName
			),
			TaskEither.chainOptionK(
				(): Error =>
					new BadRequestError(
						`No watchlist for name: ${params.watchlistName}`
					)
			)(identity),
			TaskEither.fold(errorTask(next), () => async () => {
				res.status(204).end();
			})
		);
	};

export const renameWatchlist: ReaderT<ExpressDependencies, TaskRoute> =
	({ watchlistRepository }) =>
	(req: Request, res: Response, next: NextFunction) => {
		const token = req.user as KeycloakToken;
		const userId = getUserId(token);
		const params = req.params as unknown as RenameParams;
		return pipe(
			watchlistRepository.renameWatchlistForUser(
				userId,
				params.oldWatchlistName,
				params.newWatchlistName
			),
			TaskEither.fold(errorTask(next), () => async () => {
				res.status(204).end();
			})
		);
	};

export const addInvestment: ReaderT<ExpressDependencies, TaskRoute> =
	({ watchlistRepository }) =>
	(req: Request, res: Response, next: NextFunction) => {
		const token = req.user as KeycloakToken;
		const userId = getUserId(token);
		const params = req.params as unknown as ModifyInvestmentParams;
		return pipe(
			watchlistRepository.addInvestmentForUser(
				userId,
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

export const removeInvestment: ReaderT<ExpressDependencies, TaskRoute> =
	({ watchlistRepository }) =>
	(req: Request, res: Response, next: NextFunction) => {
		const token = req.user as KeycloakToken;
		const userId = getUserId(token);
		const params = req.params as unknown as ModifyInvestmentParams;
		return pipe(
			watchlistRepository.removeInvestmentForUser(
				userId,
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

export const getAllNames: ReaderT<ExpressDependencies, TaskRoute> = pipe(
	Reader.asks<ExpressDependencies, WatchlistRepository>(
		({ watchlistRepository }) => watchlistRepository
	),
	Reader.map(
		(watchlistRepository) =>
			(req: Request, res: Response, next: NextFunction) => {
				const token = req.user as KeycloakToken;
				const userId = getUserId(token);
				return pipe(
					watchlistRepository.getAllNamesForUser(userId),
					TaskEither.fold(errorTask(next), (_) => async () => {
						res.json(_);
					})
				);
			}
	)
);

export const createNewWatchlist: ReaderT<ExpressDependencies, TaskRoute> = pipe(
	Reader.asks<ExpressDependencies, WatchlistRepository>(
		({ watchlistRepository }) => watchlistRepository
	),
	Reader.map(
		(watchlistRepository) =>
			(req: Request, res: Response, next: NextFunction) => {
				const token = req.user as KeycloakToken;
				const userId = getUserId(token);
				return pipe(
					watchlistRepository.createWatchlistForUser(
						userId,
						req.body as WatchlistInput
					),
					TaskEither.fold(errorTask(next), (_) => async () => {
						res.json(_);
					})
				);
			}
	)
);

export const getWatchlistsByUser: ReaderT<ExpressDependencies, TaskRoute> =
	pipe(
		Reader.asks<ExpressDependencies, WatchlistRepository>(
			({ watchlistRepository }) => watchlistRepository
		),
		Reader.map(
			(watchlistRepository) =>
				(req: Request, res: Response, next: NextFunction) => {
					const token = req.user as KeycloakToken;
					const userId = getUserId(token);
					return pipe(
						watchlistRepository.findWatchlistsForUser(userId),
						TaskEither.fold(errorTask(next), (_) => async () => {
							res.json(_);
						})
					);
				}
		)
	);

export const saveWatchlistsForUser: ReaderT<ExpressDependencies, TaskRoute> =
	pipe(
		Reader.asks<ExpressDependencies, WatchlistRepository>(
			({ watchlistRepository }) => watchlistRepository
		),
		Reader.map(
			(watchlistRepository) =>
				(req: Request, res: Response, next: NextFunction) => {
					const token = req.user as KeycloakToken;
					const userId = getUserId(token);
					return pipe(
						watchlistRepository.saveWatchlistsForUser(
							userId,
							req.body
						),
						TaskEither.chain(() =>
							watchlistRepository.findWatchlistsForUser(userId)
						),
						TaskEither.fold(errorTask(next), (_) => async () => {
							res.json(_);
						})
					);
				}
		)
	);
