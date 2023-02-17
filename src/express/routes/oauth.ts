import { RouteCreator } from './RouteCreator';
import { Router } from 'express';
import { Route } from '../Route';
import * as Reader from 'fp-ts/Reader';
import { pipe } from 'fp-ts/function';
import { newRouter } from './routeUtils';
import * as oAuthService from '../../services/routes/OAuthService';
import { keycloakSecure } from '../../keycloak/keycloakSecure';

interface RouterAndRoutes {
	readonly router: Router;
	readonly getAuthUser: Route;
}

const configureRoutes = ({ router, getAuthUser }: RouterAndRoutes): Router => {
	router.get('/user', ...keycloakSecure(), getAuthUser);
	return router;
};

export const createOAuthRoutes: RouteCreator = pipe(
	newRouter('/oauth'),
	Reader.bindTo('router'),
	Reader.bind('getAuthUser', () => Reader.of(oAuthService.getAuthUser)),
	Reader.map(configureRoutes)
);
