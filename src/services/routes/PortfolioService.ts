import { NextFunction, Request, Response } from 'express';
import { pipe } from 'fp-ts/function';
import * as TaskEither from 'fp-ts/TaskEither';
import { ExpressRouteDependencies } from '../../express/ExpressDependencies';
import { ReaderT } from '@craigmiller160/ts-functions/types';
import { errorTask } from '../../function/Route';
import { TaskRoute } from '../../express/Route';
import * as Reader from 'fp-ts/Reader';
import { PortfolioRepository } from '../../data/repo/PortfolioRepository';
import { getUserId, KeycloakToken } from '../../keycloak/KeycloakToken';

export const getPortfoliosByUser: ReaderT<ExpressRouteDependencies, TaskRoute> =
	pipe(
		Reader.asks<ExpressRouteDependencies, PortfolioRepository>(
			({ portfolioRepository }) => portfolioRepository
		),
		Reader.map(
			(portfolioRepository) =>
				(req: Request, res: Response, next: NextFunction) => {
					const token = req.user as KeycloakToken;
					const userId = getUserId(token);
					return pipe(
						portfolioRepository.findPortfoliosForUser(userId),
						TaskEither.fold(errorTask(next), (_) => async () => {
							res.json(_);
						})
					);
				}
		)
	);

export const savePortfoliosForUser: ReaderT<
	ExpressRouteDependencies,
	TaskRoute
> = pipe(
	Reader.asks<ExpressRouteDependencies, PortfolioRepository>(
		({ portfolioRepository }) => portfolioRepository
	),
	Reader.map(
		(portfolioRepository) =>
			(req: Request, res: Response, next: NextFunction) => {
				const token = req.user as KeycloakToken;
				const userId = getUserId(token);
				return pipe(
					portfolioRepository.savePortfoliosForUser(userId, req.body),
					TaskEither.chain(() =>
						portfolioRepository.findPortfoliosForUser(userId)
					),
					TaskEither.fold(errorTask(next), (_) => async () => {
						res.json(_);
					})
				);
			}
	)
);
