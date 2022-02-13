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
import { createSecure2 } from '../auth/secure2';

export const createRoutes: ReaderT<ExpressDependencies, void> =
	Reader.sequenceArray([
		createPortfolioRoutes,
		createOAuthRoutes,
		createHealthcheckRoutes,
		createWatchlistRoutes,
		createTradierRoutes,
		createCoinGeckoRoutes
	]);

export const createRoutes2: ReaderT<ExpressDependencies, void> = (deps) => {
	const secure2 = createSecure2({
		hasRefreshed: false,
		appRefreshTokenRepository: deps.appRefreshTokenRepository
	});

	const routeDependencies: ExpressRouteDependencies = {
		...deps,
		secure2
	};

	return Reader.sequenceArray([
		createPortfolioRoutes,
		createOAuthRoutes,
		createHealthcheckRoutes,
		createWatchlistRoutes,
		createTradierRoutes,
		createCoinGeckoRoutes
	])(routeDependencies);
};

export const createRoutes3: ReaderT<ExpressDependencies, void> = Reader.asks(
	(deps) => {
		const secure2 = createSecure2({
			hasRefreshed: false,
			appRefreshTokenRepository: deps.appRefreshTokenRepository
		});
		const routeDependencies: ExpressRouteDependencies = {
			...deps,
			secure2
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
