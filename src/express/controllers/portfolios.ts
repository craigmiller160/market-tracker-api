import { Controller } from './Controller';
import { secureReaderTask } from '../auth/secure';
import * as portfolioService from '../../services/routes/PortfolioService';
import { ReaderT } from '@craigmiller160/ts-functions/types';
import { ExpressRouteDependencies } from '../ExpressDependencies';
import { Route } from '../Route';

// TODO majorly refactor this
export const getPortfoliosForUser: ReaderT<ExpressRouteDependencies, Route> =
	(deps) => (req, res, next) =>
		portfolioService.getPortfoliosByUser(req, res, next)(deps)();

export const savePortfoliosForUser: Controller = secureReaderTask(
	portfolioService.savePortfoliosByUser
);
