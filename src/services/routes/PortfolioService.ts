import { NextFunction, Request, Response } from 'express';
import { pipe } from 'fp-ts/function';
import { AccessToken } from '../../express/auth/AccessToken';
import * as TaskEither from 'fp-ts/TaskEither';
import { ExpressRouteDependencies } from '../../express/ExpressDependencies';
import { ReaderT } from '@craigmiller160/ts-functions/types';
import { errorTask } from '../../function/Route';
import { TaskRoute } from '../../express/Route';
import * as Reader from 'fp-ts/Reader';
import { PortfolioRepository } from '../../data/repo/PortfolioRepository';

export const getPortfoliosByUser: ReaderT<
	ExpressRouteDependencies,
	TaskRoute<void>
> = pipe(
	Reader.asks<ExpressRouteDependencies, PortfolioRepository>(
		({ portfolioRepository }) => portfolioRepository
	),
	Reader.map(
		(portfolioRepository) =>
			(req: Request, res: Response, next: NextFunction) => {
				const token = req.user as AccessToken;
				return pipe(
					portfolioRepository.findPortfoliosForUser(token.userId),
					TaskEither.fold(errorTask(next), (_) => async () => {
						res.json(_);
					})
				);
			}
	)
);

export const savePortfoliosForUser: ReaderT<
	ExpressRouteDependencies,
	TaskRoute<void>
> = pipe(
	Reader.asks<ExpressRouteDependencies, PortfolioRepository>(
		({ portfolioRepository }) => portfolioRepository
	),
	Reader.map(
		(portfolioRepository) =>
			(req: Request, res: Response, next: NextFunction) => {
				const token = req.user as AccessToken;
				return pipe(
					portfolioRepository.savePortfoliosForUser(
						token.userId,
						req.body
					),
					TaskEither.chain(() =>
						portfolioRepository.findPortfoliosForUser(token.userId)
					),
					TaskEither.fold(errorTask(next), (_) => async () => {
						res.json(_);
					})
				);
			}
	)
);
