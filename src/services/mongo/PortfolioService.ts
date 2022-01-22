import * as TE from 'fp-ts/TaskEither';
import {
	Portfolio,
	PortfolioModel,
	PortfolioModelInstanceType,
	portfolioToModel
} from '../../mongo/models/PortfolioModel';
import { pipe } from 'fp-ts/function';
import * as A from 'fp-ts/Array';
import * as TaskTry from '@craigmiller160/ts-functions/TaskTry';
import { logAndReturn, logger } from '../../logger';

export const findPortfoliosForUser = (
	userId: number
): TaskTry.TaskTry<Portfolio[]> => {
	logger.info(`Finding portfolios for user. ID: ${userId}`);
	return TaskTry.tryCatch(() => PortfolioModel.find({ userId }).exec());
};

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
): TaskTry.TaskTry<unknown> => {
	logger.info(`Saving portfolios for user. ID: ${userId}`);
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
		TE.mapLeft(logAndReturn('error', 'Error closing session'))
	);

	return postTxnTE;
};
