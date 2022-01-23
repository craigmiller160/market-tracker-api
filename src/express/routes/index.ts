import { healthcheck } from './healthcheck';
import { createPortfolioRoutes } from './portfolios';
import { createWatchlistRoutes } from './watchlists';
import { createOAuthRoutes } from './oauth';
import * as Reader from 'fp-ts/Reader';
import { ExpressDependencies } from '../ExpressDependencies';

export const createRoutes: Reader.Reader<ExpressDependencies, void> = (
	dependencies
) => {
	// TODO see if there's any kind of sequence option here
	createPortfolioRoutes(dependencies);
	createWatchlistRoutes(dependencies.expressApp);
	healthcheck(dependencies.expressApp);
	createOAuthRoutes(dependencies.expressApp);
};
