import { Portfolio } from '../modelTypes/Portfolio';
import { TaskTryT } from '@craigmiller160/ts-functions/types';

export type FindPortfoliosForUser = (
	userId: string
) => TaskTryT<ReadonlyArray<Portfolio>>;

export type SavePortfoliosForUser = (
	userId: string,
	portfolios: ReadonlyArray<Portfolio>
) => TaskTryT<unknown>;

export interface PortfolioRepository {
	readonly findPortfoliosForUser: FindPortfoliosForUser;
	readonly savePortfoliosForUser: SavePortfoliosForUser;
}
