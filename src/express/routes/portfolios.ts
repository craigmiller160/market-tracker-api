import { RouteCreator } from './RouteCreator';
import { Request } from 'express';
import { secure } from '../auth/secure';
import { Portfolio } from '../../data/modelTypes/Portfolio';
import {
	getPortfoliosByUser,
	savePortfoliosByUser
} from '../../services/portfolio/PortfolioService';

export const createPortfolioRoutes: RouteCreator = (dependencies) => {
	dependencies.expressApp.get(
		'/portfolios',
		secure((req, res) => getPortfoliosByUser(req, res)(dependencies)())
	);

	dependencies.expressApp.post(
		'/portfolios',
		secure(
			(req: Request<unknown, unknown, ReadonlyArray<Portfolio>>, res) =>
				savePortfoliosByUser(req, res)(dependencies)()
		)
	);
};
