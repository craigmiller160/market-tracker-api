import { Router } from 'express';
import { Route } from '../Route';
import { RouteCreator } from './RouteCreator';
import { pipe } from 'fp-ts/function';
import { newRouter } from './routeUtils';
import * as Reader from 'fp-ts/Reader';
import * as coinGeckoController from '../controllers/coingecko';

interface RouterAndRoutes {
	readonly router: Router;
	readonly queryCoinGecko: Route;
}

const configureRoutes = ({
	router,
	queryCoinGecko
}: RouterAndRoutes): Router => {
	router.get(/^(.*)$/, queryCoinGecko);
	return router;
};

export const createCoinGeckoRoutes: RouteCreator = pipe(
	newRouter('/coingecko'),
	Reader.bindTo('router'),
	Reader.bind('queryCoinGecko', () => coinGeckoController.queryCoinGecko),
	Reader.map(configureRoutes)
);
