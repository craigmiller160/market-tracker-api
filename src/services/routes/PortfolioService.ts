import { NextFunction, Request, Response } from 'express';
import { pipe } from 'fp-ts/function';
import { AccessToken } from '../../express/auth/AccessToken';
import * as TaskEither from 'fp-ts/TaskEither';
import { Portfolio } from '../../data/modelTypes/Portfolio';
import { ExpressDependencies } from '../../express/ExpressDependencies';
import { ReaderTaskT } from '@craigmiller160/ts-functions/types';
import { errorTask } from '../../function/Route';

export const getPortfoliosByUser =
	(
		req: Request,
		res: Response,
		next: NextFunction
	): ReaderTaskT<ExpressDependencies, unknown> =>
	({ portfolioRepository }) => {
		const token = req.user as AccessToken;
		return pipe(
			portfolioRepository.findPortfoliosForUser(token.userId),
			TaskEither.fold(errorTask(next), (_) => async () => {
				res.json(_);
			})
		);
	};

export const savePortfoliosByUser =
	(
		req: Request<unknown, unknown, ReadonlyArray<Portfolio>>,
		res: Response,
		next: NextFunction
	): ReaderTaskT<ExpressDependencies, unknown> =>
	({ portfolioRepository }) => {
		const token = req.user as AccessToken;
		return pipe(
			portfolioRepository.savePortfoliosForUser(token.userId, req.body),
			TaskEither.chain(() =>
				portfolioRepository.findPortfoliosForUser(token.userId)
			),
			TaskEither.fold(errorTask(next), (_) => async () => {
				res.json(_);
			})
		);
	};
