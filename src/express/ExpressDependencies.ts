import { PortfolioRepository } from '../data/repo/PortfolioRepository';
import { Express } from 'express';
import { WatchlistRepository } from '../data/repo/WatchlistRepository';
import { AppRefreshTokenRepository } from '../data/repo/AppRefreshTokenRepository';
import { Route } from './Route';

export interface ExpressDependencies {
	readonly portfolioRepository: PortfolioRepository;
	readonly watchlistRepository: WatchlistRepository;
	readonly appRefreshTokenRepository: AppRefreshTokenRepository;
	readonly expressApp: Express;
}

// TODO delete this
export interface ExpressRouteDependencies extends ExpressDependencies {

}
