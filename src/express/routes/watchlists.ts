import { RouteCreator } from './RouteCreator';
import { Router } from 'express';
import { pipe } from 'fp-ts/function';
import * as Reader from 'fp-ts/Reader';
import { ExpressDependencies } from '../ExpressDependencies';
import * as watchlistController from '../controllers/watchlists';
import { Route } from '../Route';

interface RouterAndRoutes {
	readonly router: Router;
	readonly getWatchlistsForUser: Route;
	readonly saveWatchlistsForUser: Route;
}

const configureRoutes = ({
	router,
	getWatchlistsForUser,
	saveWatchlistsForUser
}: RouterAndRoutes): Router => {
	router.get('/', getWatchlistsForUser);
	router.post('/', saveWatchlistsForUser);
	return router;
};

export const createWatchlistRoutes: RouteCreator = pipe(
	Reader.asks<ExpressDependencies, Router>(({ expressApp }) => {
		const router = Router();
		expressApp.use('/watchlists', router);
		return router;
	}),
	Reader.bindTo('router'),
	Reader.bind(
		'getWatchlistsForUser',
		() => watchlistController.getWatchlistsForUser
	),
	Reader.bind(
		'saveWatchlistsForUser',
		() => watchlistController.saveWatchlistsForUser
	),
	Reader.map(configureRoutes)
);
