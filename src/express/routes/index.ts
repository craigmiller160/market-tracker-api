import { healthcheck } from './healthcheck';
import { createPortfolioRoutes } from './portfolios';
import { createWatchlistRoutes } from './watchlists';
import { createOAuthRoutes } from './oauth';
import * as Reader from 'fp-ts/Reader';
import { ExpressDependencies } from '../ExpressDependencies';
import { ReaderT } from '@craigmiller160/ts-functions/types';

export const createRoutes: ReaderT<ExpressDependencies, void> = (
	dependencies
): unknown =>
	Reader.sequenceArray([
		createPortfolioRoutes,
		createWatchlistRoutes,
		healthcheck,
		createOAuthRoutes
	])(dependencies);
