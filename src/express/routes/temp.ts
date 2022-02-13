// TODO delete this
import { RouteCreator } from './RouteCreator';
import { pipe } from 'fp-ts/function';
import { newRouter } from './routeUtils';
import * as Reader from 'fp-ts/Reader';
import * as tempController from '../controllers/temp';
import { Router } from 'express';
import { Route } from '../Route';
import { secure2 } from '../auth/secure2';

interface RouterAndRoutes {
	readonly router: Router;
	readonly hello: Route;
}

const configureRoutes = ({ router, hello }: RouterAndRoutes): Router => {
	router.get('/hello', secure2(), hello);
	return router;
};

export const createTempRoutes: RouteCreator = pipe(
	newRouter('/temp'),
	Reader.bindTo('router'),
	Reader.bind('hello', () => tempController.hello),
	Reader.map(configureRoutes)
);
