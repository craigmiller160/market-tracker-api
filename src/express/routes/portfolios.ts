import { Router } from 'express';
import * as Reader from 'fp-ts/Reader';
import { pipe } from 'fp-ts/function';
import * as portfolioController from '../controllers/portfolios';
import { Route, TaskRoute } from '../Route';
import { newSecureRouter } from './routeUtils';
import { ReaderT } from '@craigmiller160/ts-functions/types';
import { ExpressRouteDependencies } from '../ExpressDependencies';
import * as portfolioService from '../../services/routes/PortfolioService';

// TODO majorly refactor and cleanup

interface RouterAndRoutes {
	readonly router: Router;
	readonly getPortfoliosForUser: TaskRoute<void>;
	// readonly savePortfoliosForUser: Route;
}

// TODO refactor/clean this up
const configureRoutes = ({
	router,
	getPortfoliosForUser
}: // savePortfoliosForUser
RouterAndRoutes): Router => {
	router.get('/', (req, res, next) => getPortfoliosForUser(req, res, next)());
	// router.post('/', savePortfoliosForUser);
	return router;
};

export const createPortfolioRoutes: ReaderT<ExpressRouteDependencies, void> =
	pipe(
		newSecureRouter('/portfolios'),
		Reader.bindTo('router'),
		Reader.bind(
			'getPortfoliosForUser',
			() => portfolioService.getPortfoliosByUser2
		),
		// Reader.bind(
		// 	'savePortfoliosForUser',
		// 	() => portfolioController.savePortfoliosForUser
		// ),
		Reader.map(configureRoutes)
	);
