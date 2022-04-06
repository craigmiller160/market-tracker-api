import { RouteCreator } from './RouteCreator';
import { Router } from 'express';
import { pipe } from 'fp-ts/function';
import * as Reader from 'fp-ts/Reader';
import * as watchlistService from '../../services/routes/WatchlistService';
import { TaskRoute, taskRouteToRoute } from '../Route';
import { newSecureRouter } from './routeUtils';

interface RouterAndRoutes {
	readonly router: Router;
	readonly getWatchlistsForUser: TaskRoute;
	readonly saveWatchlistsForUser: TaskRoute;
}

const configureRoutes = ({
	router,
	getWatchlistsForUser,
	saveWatchlistsForUser
}: RouterAndRoutes): Router => {
	router.get('/all', taskRouteToRoute(getWatchlistsForUser));
	router.post('/all', taskRouteToRoute(saveWatchlistsForUser));
	return router;
};

export const createWatchlistRoutes: RouteCreator = pipe(
	newSecureRouter('/watchlists'),
	Reader.bindTo('router'),
	Reader.bind(
		'getWatchlistsForUser',
		() => watchlistService.getWatchlistsByUser
	),
	Reader.bind(
		'saveWatchlistsForUser',
		() => watchlistService.saveWatchlistsForUser
	),
	Reader.map(configureRoutes)
);
