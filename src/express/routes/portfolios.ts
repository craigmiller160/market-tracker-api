import { RouteCreator } from './RouteCreator';
import { Router } from 'express';
import * as Reader from 'fp-ts/Reader';
import { pipe } from 'fp-ts/function';
import * as portfolioController from '../controllers/portfolios';
import { Route } from '../Route';
import { newRouter, newRouter2 } from './routeUtils';
import { ReaderT } from '@craigmiller160/ts-functions/types';
import { ExpressRouteDependencies } from '../ExpressDependencies';

// TODO majorly refactor and cleanup

interface RouterAndRoutes {
	readonly router: Router;
	readonly secure2: Route;
	readonly getPortfoliosForUser: Route;
	// readonly savePortfoliosForUser: Route;
}

// TODO refactor/clean this up
const configureRoutes = ({
	router,
	secure2,
	getPortfoliosForUser
}: // savePortfoliosForUser
RouterAndRoutes): Router => {
	router.get('/', secure2, getPortfoliosForUser);
	// router.post('/', savePortfoliosForUser);
	return router;
};

export const createPortfolioRoutes: ReaderT<ExpressRouteDependencies, void> =
	pipe(
		newRouter2('/portfolios'),
		Reader.bindTo('router'),
		Reader.bind(
			'getPortfoliosForUser',
			() => portfolioController.getPortfoliosForUser
		),
		// Reader.bind(
		// 	'savePortfoliosForUser',
		// 	() => portfolioController.savePortfoliosForUser
		// ),
		Reader.bind('secure2', () => Reader.asks(({ secure2 }) => secure2)),
		Reader.map(configureRoutes)
	);
