import { RouteCreator } from './RouteCreator';
import * as TE from 'fp-ts/TaskEither';
import { pipe } from 'fp-ts/function';
import { Request } from 'express';
import { secure } from '../auth/secure';
import { AccessToken } from '../auth/AccessToken';
import { Portfolio } from '../../data/modelTypes/Portfolio';
import { portfolioRepository } from '../../data/repo';

export const createPortfolioRoutes: RouteCreator = (app) => {
	app.get(
		'/portfolios',
		secure((req, res) => {
			const token = req.user as AccessToken;
			pipe(
				portfolioRepository.findPortfoliosForUser(token.userId),
				TE.map((_) => res.json(_))
			)();
		})
	);

	app.post(
		'/portfolios',
		secure((req: Request<unknown, unknown, Portfolio[]>, res) => {
			const token = req.user as AccessToken;
			pipe(
				portfolioRepository.savePortfoliosForUser(
					token.userId,
					req.body
				),
				TE.chain(() =>
					portfolioRepository.findPortfoliosForUser(token.userId)
				),
				TE.map((_) => res.json(_))
			)();
		})
	);
};
