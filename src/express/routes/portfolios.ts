import { RouteCreator } from './RouteCreator';
import { Router } from 'express';
import * as Reader from 'fp-ts/Reader';
import { pipe } from 'fp-ts/function';
import { ExpressDependencies } from '../ExpressDependencies';
import * as portfolioController from '../controllers/portfolios';
import { Route } from '../Route';

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
	Reader.asks<ExpressDependencies, Router>(({ expressApp }) => {
		const router = Router();
		expressApp.use('/portfolios', router);
		return router;
	}),
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
