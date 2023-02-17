import { RouteCreator } from './RouteCreator';
import { Router } from 'express';
import {
	IORoute,
	ioRouteToRoute,
	Route,
	TaskRoute,
	taskRouteToRoute
} from '../Route';
import * as Reader from 'fp-ts/Reader';
import { pipe } from 'fp-ts/function';
import { newRouter } from './routeUtils';
import * as oAuthService from '../../services/routes/OAuthService';

interface RouterAndRoutes {
	readonly router: Router;
	readonly getAuthUser: Route;
	readonly secure: Route;
}

const configureRoutes = ({
	router,
	getAuthUser,
	secure
}: RouterAndRoutes): Router => {
	router.get('/user', secure, getAuthUser);
	return router;
};

export const createOAuthRoutes: RouteCreator = pipe(
	newRouter('/oauth'),
	Reader.bindTo('router'),
	Reader.bind('getAuthUser', () => Reader.of(oAuthService.getAuthUser)),
	Reader.bind('secure', () => Reader.asks(({ secure }) => secure)),
	Reader.map(configureRoutes)
);
