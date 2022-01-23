import * as TaskTry from '@craigmiller160/ts-functions/TaskTry';
import { Portfolio } from '../modelTypes/Portfolio';

export interface PortfolioRepository {
	readonly findPortfoliosForUser: (
		userId: number
	) => TaskTry.TaskTry<ReadonlyArray<Portfolio>>;

	readonly savePortfoliosForUser: (
		userId: number,
		portfolios: ReadonlyArray<Portfolio>
	) => TaskTry.TaskTry<unknown>;
}
