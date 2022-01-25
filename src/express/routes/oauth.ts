import { RouteCreator } from './RouteCreator';
import { Router } from 'express';
import * as oAuthController from '../controllers/oauth';
import { Route } from '../Route';
import * as Reader from 'fp-ts/Reader';
import { pipe } from 'fp-ts/function';

interface RouterAndRoutes {
	readonly router: Router;
	readonly routes: ReadonlyArray<Route>;
}

const configureRoutes = ({ router, routes }: RouterAndRoutes): Router => {
	const [getAuthUser, authCodeLogin, authCodeAuthentication, logout] = routes;
	router.get('/user', getAuthUser);
	router.post('/authcode/login', authCodeLogin);
	router.get('/authcode/code', authCodeAuthentication);
	router.get('/logout', logout);
	return router;
};

export const createOAuthRoutes: RouteCreator = pipe(
	Reader.of(Router()),
	Reader.bindTo('router'),
	Reader.bind('routes', () =>
		Reader.sequenceArray([
			oAuthController.getAuthUser,
			oAuthController.getAuthCodeLogin,
			oAuthController.authCodeAuthentication,
			oAuthController.logout
		])
	),
	Reader.map(configureRoutes)
);
