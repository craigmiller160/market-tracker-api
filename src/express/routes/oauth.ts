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
	readonly getAuthCodeLogin: IORoute<void>;
	readonly authCodeAuthentication: TaskRoute<void>;
	readonly logout: TaskRoute<void>;
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
	Reader.bind('secure', () => Reader.asks(({ secure2 }) => secure2)),
	Reader.map(configureRoutes)
);
