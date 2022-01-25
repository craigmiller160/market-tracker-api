import { RouteCreator } from './RouteCreator';
import { secure } from '../auth/secure';
import { logoutAndClearAuth } from '../../services/routes/OAuthService';
import { Router } from 'express';
import * as oAuthController from '../controllers/oauth';

// TODO root path is /oauth
export const createOAuthRoutes: RouteCreator = (dependencies) => {
	const router = Router();
	router.get('/oauth/user', oAuthController.getAuthUser(dependencies));
	router.post('/authcode/login', oAuthController.getAuthCodeLogin);
	router.get(
		'/authcode/code',
		oAuthController.authCodeAuthentication(dependencies)
	);
	// TODO finish refactoring this hard one
	router.get(
		'/oauth/logout',
		secure((req, res, next) =>
			logoutAndClearAuth(req, res, next)(dependencies)()
		)(dependencies)
	);

	return router;
};
