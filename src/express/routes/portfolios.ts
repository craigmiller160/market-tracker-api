import { Router } from 'express';
import * as Reader from 'fp-ts/Reader';
import { pipe } from 'fp-ts/function';
import { TaskRoute, taskRouteToRoute } from '../Route';
import { newSecureRouter } from './routeUtils';
import * as portfolioService from '../../services/routes/PortfolioService';
import { RouteCreator } from './RouteCreator';

interface RouterAndRoutes {
	readonly router: Router;
	readonly getPortfoliosForUser: TaskRoute;
	readonly savePortfoliosForUser: TaskRoute;
}

const configureRoutes = ({
	router,
	getPortfoliosForUser,
	savePortfoliosForUser
}: RouterAndRoutes): Router => {
	router.get('/', taskRouteToRoute(getPortfoliosForUser));
	router.post('/', taskRouteToRoute(savePortfoliosForUser));
	return router;
};

export const createPortfolioRoutes: RouteCreator = pipe(
	newSecureRouter('/portfolios'),
	Reader.bindTo('router'),
	Reader.bind(
		'getPortfoliosForUser',
		() => portfolioService.getPortfoliosByUser
	),
	Reader.bind(
		'savePortfoliosForUser',
		() => portfolioService.savePortfoliosForUser
	),
	Reader.map(configureRoutes)
);
