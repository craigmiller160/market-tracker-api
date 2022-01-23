import { ReaderTaskTryT } from '@craigmiller160/ts-functions/types';
import { ExpressDependencies } from '../../express/ExpressDependencies';
import { AccessToken } from '../../express/auth/AccessToken';
import { pipe } from 'fp-ts/function';
import * as TE from 'fp-ts/TaskEither';
import { Request, Response } from 'express';
import { Watchlist } from '../../data/modelTypes/Watchlist';

export const getWatchlistsByUser =
	(
		req: Request,
		res: Response
	): ReaderTaskTryT<ExpressDependencies, unknown> =>
	({ watchlistRepository }) => {
		const token = req.user as AccessToken;
		return pipe(
			watchlistRepository.findWatchlistsForUser(token.userId),
			TE.map((_) => res.json(_))
		);
	};

export const saveWatchlistsByUser =
	(
		req: Request<unknown, unknown, ReadonlyArray<Watchlist>>,
		res: Response
	): ReaderTaskTryT<ExpressDependencies, unknown> =>
	({ watchlistRepository }) => {
		const token = req.user as AccessToken;
		return pipe(
			watchlistRepository.saveWatchlistsForUser(token.userId, req.body),
			TE.chain(() =>
				watchlistRepository.findWatchlistsForUser(token.userId)
			),
			TE.map((_) => res.json(_))
		);
	};
