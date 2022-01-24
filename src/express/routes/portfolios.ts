import { RouteCreator } from './RouteCreator';
import { Request } from 'express';
import { secure } from '../auth/secure';
import { Portfolio } from '../../data/modelTypes/Portfolio';
import {
	getPortfoliosByUser,
	savePortfoliosByUser
} from '../../services/routes/PortfolioService';

export const createPortfolioRoutes: RouteCreator = (dependencies) => {
	dependencies.expressApp.get(
		'/portfolios',
		secure((req, res, next) =>
			getPortfoliosByUser(req, res, next)(dependencies)()
		)
	);

	dependencies.expressApp.post(
		'/portfolios',
		secure(
			(
				req: Request<unknown, unknown, ReadonlyArray<Portfolio>>,
				res,
				next
			) => savePortfoliosByUser(req, res, next)(dependencies)()
		)(dependencies)
	);
};
