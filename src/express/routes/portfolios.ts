import { Router } from 'express';
import * as Reader from 'fp-ts/Reader';
import { pipe } from 'fp-ts/function';
import * as portfolioController from '../controllers/portfolios';
import { Route } from '../Route';
import { newSecureRouter } from './routeUtils';
import { ReaderT } from '@craigmiller160/ts-functions/types';
import { ExpressRouteDependencies } from '../ExpressDependencies';

// TODO majorly refactor and cleanup

interface RouterAndRoutes {
	readonly router: Router;
	readonly getPortfoliosForUser: Route;
	// readonly savePortfoliosForUser: Route;
}

// TODO refactor/clean this up
const configureRoutes = ({
	router,
	getPortfoliosForUser
}: // savePortfoliosForUser
RouterAndRoutes): Router => {
	router.get('/', getPortfoliosForUser);
	// router.post('/', savePortfoliosForUser);
	return router;
};

export const createPortfolioRoutes: ReaderT<ExpressRouteDependencies, void> =
	pipe(
		newSecureRouter('/portfolios'),
		Reader.bindTo('router'),
		Reader.bind(
			'getPortfoliosForUser',
			() => portfolioController.getPortfoliosForUser
		),
		// Reader.bind(
		// 	'savePortfoliosForUser',
		// 	() => portfolioController.savePortfoliosForUser
		// ),
		Reader.map(configureRoutes)
	);
