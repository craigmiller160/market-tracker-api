import { RouteCreator } from './RouteCreator';
import { pipe } from 'fp-ts/function';
import {
	findWatchlistsForUser,
	saveWatchlistsForUser
} from '../../services/mongo/WatchlistService';
import * as TE from 'fp-ts/TaskEither';
import { Request } from 'express';
import { Watchlist } from '../../mongo/models/WatchlistModel';
import { AccessToken, secure } from '../TokenValidation';

export const createWatchlistRoutes: RouteCreator = (app) => {
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
