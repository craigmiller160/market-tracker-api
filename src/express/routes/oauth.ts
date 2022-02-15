import { RouteCreator } from './RouteCreator';
import { Router } from 'express';
import { ioRouteToRoute, Route } from '../Route';
import * as Reader from 'fp-ts/Reader';
import { pipe } from 'fp-ts/function';
import { newRouter } from './routeUtils';
import * as oAuthService from '../../services/routes/OAuthService';

interface RouterAndRoutes {
	readonly router: Router;
	readonly routes: ReadonlyArray<Route>;
	readonly secure: Route;
}

const configureRoutes = ({
	router,
	routes,
	secure
}: RouterAndRoutes): Router => {
	const [getAuthUser, getAuthCodeLogin, authCodeAuthentication, logout] =
		routes;
	router.get('/user', secure, getAuthUser);
	router.post('/authcode/login', getAuthCodeLogin);
	router.get('/authcode/code', authCodeAuthentication);
	router.get('/logout', secure, logout);
	return router;
};

// TODO possible solution: apply the route conversion function at the service level
export const createOAuthRoutes: RouteCreator = pipe(
	newRouter('/oauth'),
	Reader.bindTo('router'),
	Reader.bind('routes', () =>
		Reader.sequenceArray([
			Reader.of(oAuthService.getAuthUser),
			// TODO move this down a level
			Reader.of(ioRouteToRoute(oAuthService.getAuthCodeLogin)),
			oAuthService.authCodeAuthentication,
			oAuthService.logoutAndClearAuth
		])
	),
	Reader.bind('secure', () => Reader.asks(({ secure }) => secure)),
	Reader.map(configureRoutes)
);
