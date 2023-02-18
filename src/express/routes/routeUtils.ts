import * as Reader from 'fp-ts/Reader';
import { ReaderT } from '@craigmiller160/ts-functions/types';
import { ExpressDependencies } from '../ExpressDependencies';
import { Router } from 'express';
import { emptyRoute } from '../Route';
import { keycloakSecure } from '../../keycloak/keycloakSecure';

export const newRouter = (
	baseUrl: string
): ReaderT<ExpressDependencies, Router> => createNewRouter(baseUrl, false);

export const newSecureRouter = (
	baseUrl: string
): ReaderT<ExpressDependencies, Router> => createNewRouter(baseUrl, true);

const createNewRouter = (
	baseUrl: string,
	isSecure: boolean
): ReaderT<ExpressDependencies, Router> =>
	Reader.asks(({ expressApp }) => {
		const middleware = isSecure ? keycloakSecure() : [emptyRoute];
		const router = Router();
		expressApp.use(baseUrl, ...middleware, router);
		return router;
	});
