import { RouteCreator } from './RouteCreator';
import { Router } from 'express';
import * as oAuthController from '../controllers/oauth';
import { Route } from '../Route';
import * as Reader from 'fp-ts/Reader';
import { pipe } from 'fp-ts/function';

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

export const createOAuthRoutes: RouteCreator = pipe(
	Reader.of(Router()),
	Reader.bindTo('router'),
	Reader.bind('getAuthUser', () => oAuthController.getAuthUser),
	Reader.bind('getAuthCodeLogin', () => oAuthController.getAuthCodeLogin),
	Reader.bind(
		'authCodeAuthentication',
		() => oAuthController.authCodeAuthentication
	),
	Reader.bind('logout', () => oAuthController.logout),
	Reader.map(configureRoutes),
	Reader.chain((router) =>
		Reader.asks(({ expressApp }) => expressApp.use('/oauth', router))
	)
);
