import { Request, Response } from 'express';
import { pipe } from 'fp-ts/function';
import { AccessToken } from '../../express/auth/AccessToken';
import * as TaskEither from 'fp-ts/TaskEither';
import * as ReaderTaskEither from 'fp-ts/ReaderTaskEither';
import { Portfolio } from '../../data/modelTypes/Portfolio';
import { ExpressDependencies } from '../../express/ExpressDependencies';

// TODO handle errors here and for watchlist too

export const getPortfoliosByUser =
	(
		req: Request,
		res: Response
	): ReaderTaskEither.ReaderTaskEither<ExpressDependencies, Error, unknown> =>
	({ portfolioRepository }) => {
		const token = req.user as AccessToken;
		return pipe(
			portfolioRepository.findPortfoliosForUser(token.userId),
			TaskEither.map((_) => res.json(_))
		);
	};

export const savePortfoliosByUser =
	(
		req: Request<unknown, unknown, ReadonlyArray<Portfolio>>,
		res: Response
	): ReaderTaskEither.ReaderTaskEither<ExpressDependencies, Error, unknown> =>
	({ portfolioRepository }) => {
		const token = req.user as AccessToken;
		return pipe(
			portfolioRepository.savePortfoliosForUser(token.userId, req.body),
			TaskEither.chain(() =>
				portfolioRepository.findPortfoliosForUser(token.userId)
			),
			TaskEither.map((_) => res.json(_))
		);
	};
