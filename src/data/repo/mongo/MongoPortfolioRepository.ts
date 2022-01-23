import {
	FindPortfoliosForUser,
	SavePortfoliosForUser
} from '../PortfolioRepository';
import { logAndReturn, logger } from '../../../logger';
import * as TaskTry from '@craigmiller160/ts-functions/TaskTry';
import {
	PortfolioModel,
	PortfolioModelInstanceType,
	portfolioToModel
} from '../../../mongo/models/PortfolioModel';
import { pipe } from 'fp-ts/function';
import * as RArray from 'fp-ts/ReadonlyArray';
import * as TaskEither from 'fp-ts/TaskEither';

export const findPortfoliosForUser: FindPortfoliosForUser = (userId) => {
	logger.info(`Finding portfolios for user. ID: ${userId}`);
	return TaskTry.tryCatch(() => PortfolioModel.find({ userId }).exec());
};

const replacePortfoliosForUser = async (
	userId: number,
	portfolioModels: ReadonlyArray<PortfolioModelInstanceType>
): Promise<void> => {
	await PortfolioModel.deleteMany({ userId }).exec();
	await PortfolioModel.insertMany(portfolioModels);
};

export const savePortfoliosForUser: SavePortfoliosForUser = (
	userId,
	portfolios
) => {
	logger.info(`Saving portfolios for user. ID: ${userId}`);
	const portfolioModels = pipe(
		portfolios,
		RArray.map((_) =>
			portfolioToModel({
				..._,
				userId
			})
		)
	);

	const sessionTE = TaskTry.tryCatch(() => PortfolioModel.startSession());

	const postTxnTE = pipe(
		sessionTE,
		TaskEither.chainFirst((session) =>
			TaskTry.tryCatch(() =>
				session.withTransaction(() =>
					replacePortfoliosForUser(userId, portfolioModels)
				)
			)
		)
	);

	pipe(
		sessionTE,
		TaskEither.chain((session) =>
			TaskTry.tryCatch(() => session.endSession())
		),
		TaskEither.mapLeft(logAndReturn('error', 'Error closing session'))
	);

	return postTxnTE;
};
