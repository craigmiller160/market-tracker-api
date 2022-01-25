import { OldRouteCreator } from './RouteCreator';
import { Request } from 'express';
import { secure } from '../auth/secure';
import { Watchlist } from '../../data/modelTypes/Watchlist';
import {
	getWatchlistsByUser,
	saveWatchlistsByUser
} from '../../services/routes/WatchlistService';

export const createWatchlistRoutes: OldRouteCreator = (dependencies) => {
	dependencies.expressApp.get(
		'/watchlists',
		secure((req, res, next) =>
			getWatchlistsByUser(req, res, next)(dependencies)()
		)(dependencies)
	);

	dependencies.expressApp.post(
		'/watchlists',
		secure(
			(
				req: Request<unknown, unknown, ReadonlyArray<Watchlist>>,
				res,
				next
			) => saveWatchlistsByUser(req, res, next)(dependencies)()
		)(dependencies)
	);
};
