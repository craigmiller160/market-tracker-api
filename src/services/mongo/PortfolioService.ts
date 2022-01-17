import * as TE from 'fp-ts/TaskEither';
import {
	Portfolio,
	PortfolioModel,
	PortfolioModelInstanceType,
	portfolioToModel
} from '../../mongo/models/PortfolioModel';
import { pipe } from 'fp-ts/function';
import * as A from 'fp-ts/Array';
import * as TEU from '../../function/TaskEitherUtils';
import * as TaskTry from '@craigmiller160/ts-functions/TaskTry';
import { logger } from '../../logger';

export const findPortfoliosForUser = (
	userId: number
): TEU.TaskEither<Portfolio[]> =>
	TaskTry.tryCatch(() => PortfolioModel.find({ userId }).exec());

const replacePortfoliosForUser = async (
	userId: number,
	portfolioModels: PortfolioModelInstanceType[]
): Promise<void> => {
	await PortfolioModel.deleteMany({ userId }).exec();
	await PortfolioModel.insertMany(portfolioModels);
};

export const savePortfoliosForUser = (
	userId: number,
	portfolios: Portfolio[]
): TEU.TaskEither<unknown> => {
	const portfolioModels = pipe(
		portfolios,
		A.map((_) =>
			portfolioToModel({
				..._,
				userId
			})
		)
	);

	const sessionTE = TaskTry.tryCatch(() => PortfolioModel.startSession());

	const postTxnTE = pipe(
		sessionTE,
		TE.chainFirst((session) =>
			TaskTry.tryCatch(() =>
				session.withTransaction(() =>
					replacePortfoliosForUser(userId, portfolioModels)
				)
			)
		)
	);

	pipe(
		sessionTE,
		TE.chain((session) => TaskTry.tryCatch(() => session.endSession())),
		TE.mapLeft((ex) => {
			logger.error('Error closing session');
			logger.error(ex);
			return ex;
		})
	);

	return postTxnTE;
};
