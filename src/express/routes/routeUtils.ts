import * as Reader from 'fp-ts/Reader';
import { ReaderT } from '@craigmiller160/ts-functions/types';
import { ExpressRouteDependencies } from '../ExpressDependencies';
import { Router } from 'express';
import { emptyRoute } from '../Route';
import { keycloakSecure } from '../../keycloak/keycloakSecure';

export const newRouter = (
	baseUrl: string
): ReaderT<ExpressRouteDependencies, Router> => createNewRouter(baseUrl, false);

export const newSecureRouter = (
	baseUrl: string
): ReaderT<ExpressRouteDependencies, Router> => createNewRouter(baseUrl, true);

const createNewRouter = (
	baseUrl: string,
	isSecure: boolean
): ReaderT<ExpressRouteDependencies, Router> =>
	Reader.asks(({ expressApp }) => {
		const middleware = isSecure ? keycloakSecure() : [emptyRoute];
		const router = Router();
		expressApp.use(baseUrl, ...middleware, router);
		return router;
	});
