import { RouteCreator } from './RouteCreator';
import { Request } from 'express';
import { secure } from '../auth/secure';
import { Watchlist } from '../../data/modelTypes/Watchlist';
import {
	getWatchlistsByUser,
	saveWatchlistsByUser
} from '../../services/routes/WatchlistService';

export const createWatchlistRoutes: RouteCreator = (dependencies) => {
	dependencies.expressApp.get(
		'/watchlists',
		secure((req, res) => getWatchlistsByUser(req, res)(dependencies)())
	);

	dependencies.expressApp.post(
		'/watchlists',
		secure(
			(req: Request<unknown, unknown, ReadonlyArray<Watchlist>>, res) =>
				saveWatchlistsByUser(req, res)(dependencies)()
		)
	);
};
