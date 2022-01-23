import { RouteCreator } from './RouteCreator';
import { Request } from 'express';
import { secure } from '../auth/secure';
import { Portfolio } from '../../data/modelTypes/Portfolio';
import {
	getPortfoliosByUser,
	savePortfoliosByUser
} from '../../services/portfolio/PortfolioService';

export const createPortfolioRoutes: RouteCreator = (app) => {
	app.get(
		'/portfolios',
		secure((req, res) => getPortfoliosByUser(req, res)())
	);

	app.post(
		'/portfolios',
		secure(
			(req: Request<unknown, unknown, ReadonlyArray<Portfolio>>, res) =>
				savePortfoliosByUser(req, res)()
		)
	);
};
