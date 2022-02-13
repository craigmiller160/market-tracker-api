import { Router } from 'express';
import { TaskRoute, taskRouteToRoute } from '../Route';
import { RouteCreator } from './RouteCreator';
import { pipe } from 'fp-ts/function';
import { newSecureRouter } from './routeUtils';
import * as Reader from 'fp-ts/Reader';
import * as coinGeckoService from '../../services/routes/CoinGeckoService';

interface RouterAndRoutes {
	readonly router: Router;
	readonly queryCoinGecko: TaskRoute<void>;
}

const configureRoutes = ({
	router,
	queryCoinGecko
}: RouterAndRoutes): Router => {
	router.get(/^(.*)$/, taskRouteToRoute(queryCoinGecko));
	return router;
};

export const createCoinGeckoRoutes: RouteCreator = pipe(
	newSecureRouter('/coingecko'),
	Reader.bindTo('router'),
	Reader.bind('queryCoinGecko', () =>
		Reader.of(coinGeckoService.queryCoinGecko)
	),
	Reader.map(configureRoutes)
);
