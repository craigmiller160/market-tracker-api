import { OldRouteCreator } from './RouteCreator';
import { pipe } from 'fp-ts/function';
import {
	findWatchlistsForUser,
	saveWatchlistsForUser
} from '../../services/mongo/WatchlistService';
import * as TE from 'fp-ts/TaskEither';
import { Request } from 'express';
import { AccessToken } from '../auth/AccessToken';
import { secure } from '../auth/secure';
import { Watchlist } from '../../data/modelTypes/Watchlist';

export const createWatchlistRoutes: OldRouteCreator = (app) => {
	app.get(
		'/watchlists',
		secure((req, res) => {
			const token = req.user as AccessToken;
			pipe(
				findWatchlistsForUser(token.userId),
				TE.map((_) => res.json(_))
			)();
		})
	);

	app.post(
		'/watchlists',
		secure((req: Request<unknown, unknown, Watchlist[]>, res) => {
			const token = req.user as AccessToken;
			pipe(
				saveWatchlistsForUser(token.userId, req.body),
				TE.chain(() => findWatchlistsForUser(token.userId)),
				TE.map((_) => res.json(_))
			)();
		})
	);
};
