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
	readonly createWatchlistForUser: TaskRoute;
	readonly getAllNamesForUser: TaskRoute;
	readonly addInvestmentForUser: TaskRoute;
}

const configureRoutes = ({
	router,
	getWatchlistsForUser,
	saveWatchlistsForUser,
	createWatchlistForUser,
	getAllNamesForUser,
	addInvestmentForUser
}: RouterAndRoutes): Router => {
	router.get('/all', taskRouteToRoute(getWatchlistsForUser));
	router.post('/all', taskRouteToRoute(saveWatchlistsForUser));
	router.post('/', taskRouteToRoute(createWatchlistForUser));
	router.get('/names', taskRouteToRoute(getAllNamesForUser));
	router.post(
		'/:watchlistName/:type/:symbol',
		taskRouteToRoute(addInvestmentForUser)
	);
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
	Reader.bind(
		'createWatchlistForUser',
		() => watchlistService.createNewWatchlist
	),
	Reader.bind('getAllNamesForUser', () => watchlistService.getAllNames),
	Reader.bind('addInvestmentForUser', () => watchlistService.addInvestment),
	Reader.map(configureRoutes)
);
