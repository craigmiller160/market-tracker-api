import * as TaskTry from '@craigmiller160/ts-functions/TaskTry';
import { Portfolio } from '../modelTypes/Portfolio';

export type FindPortfoliosForUser = (
	userId: number
) => TaskTry.TaskTry<ReadonlyArray<Portfolio>>;

export type SavePortfoliosForUser = (
	userId: number,
	portfolios: ReadonlyArray<Portfolio>
) => TaskTry.TaskTry<unknown>;

export interface PortfolioRepository {
	readonly findPortfoliosForUser: FindPortfoliosForUser;
	readonly savePortfoliosForUser: SavePortfoliosForUser;
}
