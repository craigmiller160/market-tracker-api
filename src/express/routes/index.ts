import { createPortfolioRoutes } from './portfolios';
import { createWatchlistRoutes } from './watchlists';
import * as Reader from 'fp-ts/Reader';
import { ExpressDependencies } from '../ExpressDependencies';
import { ReaderT } from '@craigmiller160/ts-functions/types';
import { createOAuthRoutes } from './oauth';
import { createHealthcheckRoutes } from './healthcheck';

export const createRoutes: ReaderT<ExpressDependencies, void> =
	Reader.sequenceArray([
		createPortfolioRoutes,
		createOAuthRoutes,
		createHealthcheckRoutes,
		createWatchlistRoutes
	]);
