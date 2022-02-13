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
	readonly getAuthCodeLogin: IORoute;
	readonly authCodeAuthentication: TaskRoute;
	readonly logout: TaskRoute;
	readonly secure: Route;
}

const configureRoutes = ({
	router,
	getAuthUser,
	getAuthCodeLogin,
	authCodeAuthentication,
	logout,
	secure
}: RouterAndRoutes): Router => {
	router.get('/user', secure, getAuthUser);
	router.post('/authcode/login', ioRouteToRoute(getAuthCodeLogin));
	router.get('/authcode/code', taskRouteToRoute(authCodeAuthentication));
	router.get('/logout', secure, taskRouteToRoute(logout));
	return router;
};

export const createOAuthRoutes: RouteCreator = pipe(
	newRouter('/oauth'),
	Reader.bindTo('router'),
	Reader.bind('getAuthUser', () => Reader.of(oAuthService.getAuthUser)),
	Reader.bind('getAuthCodeLogin', () =>
		Reader.of(oAuthService.getAuthCodeLogin)
	),
	Reader.bind(
		'authCodeAuthentication',
		() => oAuthService.authCodeAuthentication
	),
	Reader.bind('logout', () => oAuthService.logoutAndClearAuth),
	Reader.bind('secure', () => Reader.asks(({ secure }) => secure)),
	Reader.map(configureRoutes)
);

export const createOAuthRoutes2: RouteCreator = pipe(
	newRouter('/oauth'),
	Reader.bindTo('router'),
	Reader.bind('routes', () =>
		Reader.sequenceArray([
			Reader.of(oAuthService.getAuthUser),
			Reader.of(ioRouteToRoute(oAuthService.getAuthCodeLogin)), // TODO deal with this here, and the others later? not good
			oAuthService.authCodeAuthentication,
			oAuthService.logoutAndClearAuth
		])
	),
	Reader.map(() => {
		// Nothing
	})
);
