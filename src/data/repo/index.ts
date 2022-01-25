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
import { AppRefreshTokenRepository } from './AppRefreshTokenRepository';
import {
	deleteByTokenId,
	findByTokenId,
	saveRefreshToken
} from './mongo/MongoAppRefreshTokenRepository';

export const portfolioRepository: PortfolioRepository = {
	findPortfoliosForUser,
	savePortfoliosForUser
};

export const watchlistRepository: WatchlistRepository = {
	findWatchlistsForUser,
	saveWatchlistsForUser
};

export const appRefreshTokenRepository: AppRefreshTokenRepository = {
	deleteByTokenId,
	saveRefreshToken,
	findByTokenId
};
