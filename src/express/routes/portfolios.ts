import { RouteCreator } from './RouteCreator';
import { Router } from 'express';
import * as Reader from 'fp-ts/Reader';
import { pipe } from 'fp-ts/function';
import * as portfolioController from '../controllers/portfolios';
import { Route } from '../Route';
import { newRouter } from './routeUtils';

interface RouterAndRoutes {
	readonly router: Router;
	readonly getPortfoliosForUser: Route;
	readonly savePortfoliosForUser: Route;
}

const configureRoutes = ({
	router,
	getPortfoliosForUser,
	savePortfoliosForUser
}: RouterAndRoutes): Router => {
	router.get('/', getPortfoliosForUser);
	router.post('/', savePortfoliosForUser);
	return router;
};

export const createPortfolioRoutes: RouteCreator = pipe(
	newRouter('/portfolios'),
	Reader.bindTo('router'),
	Reader.bind(
		'getPortfoliosForUser',
		() => portfolioController.getPortfoliosForUser
	),
	Reader.bind(
		'savePortfoliosForUser',
		() => portfolioController.savePortfoliosForUser
	),
	Reader.map(configureRoutes)
);
