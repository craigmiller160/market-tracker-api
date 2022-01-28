import { Controller } from './Controller';
import { secureReaderTask } from '../auth/secure';
import * as portfolioService from '../../services/routes/PortfolioService';

export const getPortfoliosForUser: Controller = secureReaderTask(
	portfolioService.getPortfoliosByUser
);

export const savePortfoliosForUser: Controller = secureReaderTask(
	portfolioService.savePortfoliosByUser
);
