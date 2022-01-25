import { RouteCreator } from './RouteCreator';
import { secure } from '../auth/secure';
import { logoutAndClearAuth } from '../../services/routes/OAuthService';
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
	const [getAuthUser, authCodeLogin, authCodeAuthentication] = routes;
	router.get('/user', getAuthUser);
	router.post('/authcode/login', authCodeLogin);
	router.get('/authcode/code', authCodeAuthentication);
	return router;
}

export const createOAuthRoutes: RouteCreator = (dependencies) => {
	const router = pipe(
		Reader.of(Router()),
		Reader.bindTo('router'),
		Reader.bind('routes', () => Reader.sequenceArray([
			oAuthController.getAuthUser,
			oAuthController.getAuthCodeLogin,
			oAuthController.authCodeAuthentication
		])),
		Reader.map(configureRoutes)
	)(dependencies);

	// TODO finish refactoring this hard one
	router.get(
		'/logout',
		secure((req, res, next) =>
			logoutAndClearAuth(req, res, next)(dependencies)()
		)(dependencies)
	);

	return router;
};
