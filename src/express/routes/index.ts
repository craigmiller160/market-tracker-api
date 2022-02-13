import { createPortfolioRoutes } from './portfolios';
import { createWatchlistRoutes } from './watchlists';
import * as Reader from 'fp-ts/Reader';
import {
	ExpressDependencies,
	ExpressRouteDependencies
} from '../ExpressDependencies';
import { ReaderT } from '@craigmiller160/ts-functions/types';
import { createOAuthRoutes } from './oauth';
import { createHealthcheckRoutes } from './healthcheck';
import { createTradierRoutes } from './tradier';
import { createCoinGeckoRoutes } from './coingecko';
import { createSecure } from '../auth/secure2';

export const createRoutes: ReaderT<ExpressDependencies, void> = Reader.asks(
	(deps) => {
		const secure = createSecure({
			hasRefreshed: false,
			appRefreshTokenRepository: deps.appRefreshTokenRepository
		});
		const routeDependencies: ExpressRouteDependencies = {
			...deps,
			secure
		};
		return Reader.sequenceArray([
			createPortfolioRoutes,
			createOAuthRoutes,
			createHealthcheckRoutes,
			createWatchlistRoutes,
			createTradierRoutes,
			createCoinGeckoRoutes
		])(routeDependencies);
	}
);
