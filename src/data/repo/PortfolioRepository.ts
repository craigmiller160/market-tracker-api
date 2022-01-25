import { Portfolio } from '../modelTypes/Portfolio';
import { TaskTryT } from '@craigmiller160/ts-functions/types';

export type FindPortfoliosForUser = (
	userId: number
) => TaskTryT<ReadonlyArray<Portfolio>>;

export type SavePortfoliosForUser = (
	userId: number,
	portfolios: ReadonlyArray<Portfolio>
) => TaskTryT<unknown>;

export interface PortfolioRepository {
	readonly findPortfoliosForUser: FindPortfoliosForUser;
	readonly savePortfoliosForUser: SavePortfoliosForUser;
}
