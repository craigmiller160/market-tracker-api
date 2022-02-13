import * as tradierService from '../../services/routes/TradierService';
import { RouteCreator } from './RouteCreator';
import { pipe } from 'fp-ts/function';
import { newSecureRouter } from './routeUtils';
import * as Reader from 'fp-ts/Reader';
import { Router } from 'express';
import { TaskRoute, taskRouteToRoute } from '../Route';

interface RouterAndRoutes {
	readonly router: Router;
	readonly queryTradier: TaskRoute<void>;
}

const configureRoutes = ({ router, queryTradier }: RouterAndRoutes): Router => {
	router.get(/^(.*)$/, taskRouteToRoute(queryTradier));
	return router;
};

export const createTradierRoutes: RouteCreator = pipe(
	newSecureRouter('/tradier'),
	Reader.bindTo('router'),
	Reader.bind('queryTradier', () => Reader.of(tradierService.queryTradier)),
	Reader.map(configureRoutes)
);
