import { Express } from 'express';
import { healthcheck } from './healthcheck';
import { createPortfolioRoutes } from './portfolios';
import { createWatchlistRoutes } from './watchlists';
import { createOAuthRoutes } from './oauth';

export const createRoutes = (app: Express) => {
	createPortfolioRoutes(app);
	createWatchlistRoutes(app);
	healthcheck(app);
	createOAuthRoutes(app);
};
