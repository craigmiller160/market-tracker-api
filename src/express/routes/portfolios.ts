import { RouteCreator } from './RouteCreator';
import * as TE from 'fp-ts/TaskEither';
import { Portfolio } from '../../mongo/models/PortfolioModel';
import { pipe } from 'fp-ts/function';
import { Request } from 'express';
import {
	findPortfoliosForUser,
	savePortfoliosForUser
} from '../../services/mongo/PortfolioService';
import { AccessToken, secure } from '../TokenValidation';

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
