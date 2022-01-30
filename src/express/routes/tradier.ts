import * as tradierController from '../controllers/tradier';
import { RouteCreator } from './RouteCreator';
import { pipe } from 'fp-ts/function';
import { newRouter } from './routeUtils';
import * as Reader from 'fp-ts/Reader';
import { Router } from 'express';
import { Route } from '../Route';

interface RouterAndRoutes {
	readonly router: Router;
	readonly queryTradier: Route;
}

const configureRoutes = ({ router, queryTradier }: RouterAndRoutes): Router => {
	// TODO finish this
	return router;
};

export const createTradierRoutes: RouteCreator = pipe(
	newRouter('/tradier'),
	Reader.bindTo('router'),
	Reader.bind('queryTradier', () => tradierController.queryTradier),
	Reader.map(configureRoutes)
);
