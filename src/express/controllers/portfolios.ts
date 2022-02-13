import { Controller } from './Controller';
import { secureReaderTask } from '../auth/secure';
import * as portfolioService from '../../services/routes/PortfolioService';

// TODO majorly refactor this
export const getPortfoliosForUser: Controller = (deps) => (req, res, next) =>
	portfolioService.getPortfoliosByUser(req, res, next)(deps)();

export const savePortfoliosForUser: Controller = secureReaderTask(
	portfolioService.savePortfoliosByUser
);
