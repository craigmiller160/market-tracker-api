import { RouteCreator, RouteCreator2 } from './RouteCreator';
import { Router } from 'express';
import * as oAuthController from '../controllers/oauth';
import { Route } from '../Route';
import * as Reader from 'fp-ts/Reader';
import { pipe } from 'fp-ts/function';
import { newRouter, newRouter2 } from './routeUtils';
import * as oAuthService from '../../services/routes/OAuthService';

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
	router.post('/authcode/login', getAuthCodeLogin); // TODO insecure
	router.get('/authcode/code', authCodeAuthentication); // TODO insecure
	router.get('/logout', logout);
	return router;
};

export const createOAuthRoutes: RouteCreator = pipe(
	newRouter2('/oauth'),
	Reader.bindTo('router'),
	Reader.bind('getAuthUser', () => Reader.of(oAuthService.getAuthUser)),
	Reader.bind('getAuthCodeLogin', () =>
		Reader.of(oAuthService.getAuthCodeLogin)
	),
	Reader.bind(
		'authCodeAuthentication',
		() => oAuthController.authCodeAuthentication
	),
	Reader.bind('logout', () => oAuthController.logout),
	Reader.map(configureRoutes)
);
