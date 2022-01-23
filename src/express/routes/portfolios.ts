import { RouteCreator } from './RouteCreator';
import * as TE from 'fp-ts/TaskEither';
import { pipe } from 'fp-ts/function';
import { Request } from 'express';
import {
	findPortfoliosForUser,
	savePortfoliosForUser
} from '../../services/mongo/PortfolioService';
import { secure } from '../auth/secure';
import { AccessToken } from '../auth/AccessToken';
import { Portfolio } from '../../data/modelTypes/Portfolio';

export const createPortfolioRoutes: RouteCreator = (app) => {
	app.get(
		'/portfolios',
		secure((req, res) => {
			const token = req.user as AccessToken;
			pipe(
				findPortfoliosForUser(token.userId),
				TE.map((_) => res.json(_))
			)();
		})
	);

	app.post(
		'/portfolios',
		secure((req: Request<unknown, unknown, Portfolio[]>, res) => {
			const token = req.user as AccessToken;
			pipe(
				savePortfoliosForUser(token.userId, req.body),
				TE.chain(() => findPortfoliosForUser(token.userId)),
				TE.map((_) => res.json(_))
			)();
		})
	);
};
