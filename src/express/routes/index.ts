import { Express } from 'express';
import { healthcheck } from './healthcheck';
import { createPortfolioRoutes } from './portfolios';
import { createWatchlistRoutes } from './watchlists';
import { createOAuthRoutes } from './oauth';
import { RouteDependencies } from './RouteDependencies';
import { portfolioRepository } from '../../data/repo';

export const createRoutes = (app: Express) => {
	// TODO lift this even higher
	const routeDependencies: RouteDependencies = {
		portfolioRepository,
		expressApp: app
	};
	createPortfolioRoutes(routeDependencies);
	createWatchlistRoutes(app);
	healthcheck(app);
	createOAuthRoutes(app);
};
