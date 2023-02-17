import {
	FindPortfoliosForUser,
	SavePortfoliosForUser
} from '../PortfolioRepository';
import { logger } from '../../../logger';
import * as TaskTry from '@craigmiller160/ts-functions/TaskTry';
import {
	PortfolioModel,
	PortfolioModelInstanceType,
	portfolioToModel
} from '../../../mongo/models/PortfolioModel';
import { pipe } from 'fp-ts/function';
import * as RArray from 'fp-ts/ReadonlyArray';
import * as TaskEither from 'fp-ts/TaskEither';
import { closeSessionAfterTransaction } from '../../../mongo/Session';

export const findPortfoliosForUser: FindPortfoliosForUser = (userId) =>
	pipe(
		logger.debug(`Finding portfolios for user. ID: ${userId}`),
		TaskEither.rightIO,
		TaskTry.chainTryCatch(() => PortfolioModel.find({ userId }).exec())
	);

const replacePortfoliosForUser = async (
	userId: string,
	portfolioModels: ReadonlyArray<PortfolioModelInstanceType>
): Promise<void> => {
	await PortfolioModel.deleteMany({ userId }).exec();
	await PortfolioModel.insertMany(portfolioModels);
};

export const savePortfoliosForUser: SavePortfoliosForUser = (
	userId,
	portfolios
) => {
	const portfolioModels = pipe(
		portfolios,
		RArray.map((_) =>
			portfolioToModel({
				..._,
				userId
			})
		)
	);

	return pipe(
		logger.debug(`Saving portfolios for user. ID: ${userId}`),
		TaskEither.rightIO,
		TaskTry.chainTryCatch(() => PortfolioModel.startSession()),
		TaskEither.chain((session) =>
			pipe(
				TaskTry.tryCatch(() =>
					session.withTransaction(() =>
						replacePortfoliosForUser(userId, portfolioModels)
					)
				),
				closeSessionAfterTransaction(session)
			)
		)
	);
};
