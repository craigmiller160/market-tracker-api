import { PortfolioRepository } from '../data/repo/PortfolioRepository';
import { Express } from 'express';
import { WatchlistRepository } from '../data/repo/WatchlistRepository';

export interface ExpressDependencies {
	readonly portfolioRepository: PortfolioRepository;
	readonly watchlistRepository: WatchlistRepository;
	readonly expressApp: Express;
}
