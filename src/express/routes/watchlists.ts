import { RouteCreator } from './RouteCreator';
import { Router } from 'express';
import { pipe } from 'fp-ts/function';
import * as Reader from 'fp-ts/Reader';
import * as watchlistController from '../controllers/watchlists';
import { Route } from '../Route';
import { newRouter } from './routeUtils';

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
	newRouter('/watchlists'),
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
