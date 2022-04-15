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
	readonly removeInvestmentForUser: TaskRoute;
	readonly removeWatchlistForUser: TaskRoute;
	readonly renameWatchlistForUser: TaskRoute;
}

const configureRoutes = ({
	router,
	getWatchlistsForUser,
	saveWatchlistsForUser,
	createWatchlistForUser,
	getAllNamesForUser,
	addInvestmentForUser,
	removeInvestmentForUser,
	removeWatchlistForUser,
	renameWatchlistForUser
}: RouterAndRoutes): Router => {
	router.get('/all', taskRouteToRoute(getWatchlistsForUser));
	router.post('/all', taskRouteToRoute(saveWatchlistsForUser));
	router.post('/', taskRouteToRoute(createWatchlistForUser));
	router.get('/names', taskRouteToRoute(getAllNamesForUser));
	router.put(
		'/:watchlistName/:type/:symbol',
		taskRouteToRoute(addInvestmentForUser)
	);
	router.delete(
		'/:watchlistName/:type/:symbol',
		taskRouteToRoute(removeInvestmentForUser)
	);
	router.delete('/:watchlistName', taskRouteToRoute(removeWatchlistForUser));
	router.put(
		'/:oldWatchlistName/rename/:newWatchlistName',
		taskRouteToRoute(renameWatchlistForUser)
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
	Reader.bind(
		'removeInvestmentForUser',
		() => watchlistService.removeInvestment
	),
	Reader.bind(
		'removeWatchlistForUser',
		() => watchlistService.removeWatchlist
	),
	Reader.bind(
		'renameWatchlistForUser',
		() => watchlistService.renameWatchlist
	),
	Reader.map(configureRoutes)
);
