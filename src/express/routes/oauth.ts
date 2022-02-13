import { RouteCreator2 } from './RouteCreator';
import { Router } from 'express';
import * as oAuthController from '../controllers/oauth';
import { Route } from '../Route';
import * as Reader from 'fp-ts/Reader';
import { pipe } from 'fp-ts/function';
import { newRouter } from './routeUtils';

interface RouterAndRoutes {
	readonly router: Router;
	readonly getAuthUser: Route;
	readonly getAuthCodeLogin: Route;
	readonly authCodeAuthentication: Route;
	readonly logout: Route;
}

const configureRoutes = ({
	router,
	getAuthUser,
	getAuthCodeLogin,
	authCodeAuthentication,
	logout
}: RouterAndRoutes): Router => {
	router.get('/user', getAuthUser);
	router.post('/authcode/login', getAuthCodeLogin);
	router.get('/authcode/code', authCodeAuthentication);
	router.get('/logout', logout);
	return router;
};

export const createOAuthRoutes: RouteCreator2 = pipe(
	newRouter('/oauth'),
	Reader.bindTo('router'),
	Reader.bind('getAuthUser', () => oAuthController.getAuthUser),
	Reader.bind('getAuthCodeLogin', () => oAuthController.getAuthCodeLogin),
	Reader.bind(
		'authCodeAuthentication',
		() => oAuthController.authCodeAuthentication
	),
	Reader.bind('logout', () => oAuthController.logout),
	Reader.map(configureRoutes)
);
