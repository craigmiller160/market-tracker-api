import { Request, Response } from 'express';
import * as TaskTry from '@craigmiller160/ts-functions/TaskTry';
import { pipe } from 'fp-ts/function';
import { AccessToken } from '../../express/auth/AccessToken';
import { portfolioRepository } from '../../data/repo';
import * as TaskEither from 'fp-ts/TaskEither';
import { Portfolio } from '../../data/modelTypes/Portfolio';

// TODO handle errors here and for watchlist too

export const getPortfoliosByUser = (
	req: Request,
	res: Response
): TaskTry.TaskTry<unknown> => {
	const token = req.user as AccessToken;
	return pipe(
		portfolioRepository.findPortfoliosForUser(token.userId),
		TaskEither.map((_) => res.json(_))
	);
};

export const savePortfoliosByUser = (
	req: Request<unknown, unknown, ReadonlyArray<Portfolio>>,
	res: Response
): TaskTry.TaskTry<unknown> => {
	const token = req.user as AccessToken;
	return pipe(
		portfolioRepository.savePortfoliosForUser(token.userId, req.body),
		TaskEither.chain(() =>
			portfolioRepository.findPortfoliosForUser(token.userId)
		),
		TaskEither.map((_) => res.json(_))
	);
};
