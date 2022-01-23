import { PortfolioRepository } from './PortfolioRepository';
import {
	findPortfoliosForUser,
	savePortfoliosForUser
} from './mongo/MongoPortfolioRepository';
import { WatchlistRepository } from './WatchlistRepository';
import {
	findWatchlistsForUser,
	saveWatchlistsForUser
} from './mongo/MongoWatchlistRepository';

export const portfolioRepository: PortfolioRepository = {
	findPortfoliosForUser,
	savePortfoliosForUser
};

export const watchlistRepository: WatchlistRepository = {
	findWatchlistsForUser,
	saveWatchlistsForUser
};
