import { RouteCreator } from './RouteCreator';
import { secure } from '../auth/secure';
import {
	authCodeAuthentication,
	getAuthCodeLogin,
	getAuthUser,
	logoutAndClearAuth
} from '../../services/routes/OAuthService';

export const createOAuthRoutes: RouteCreator = (dependencies) => {
	dependencies.expressApp.get(
		'/oauth/user',
		secure((req, res) => getAuthUser(req, res))
	);

	dependencies.expressApp.post('/oauth/authcode/login', (req, res, next) =>
		getAuthCodeLogin(req, res, next)()
	);

	dependencies.expressApp.get('/oauth/authcode/code', (req, res, next) =>
		authCodeAuthentication(req, res, next)(dependencies)()
	);

	dependencies.expressApp.get(
		'/oauth/logout',
		secure((req, res, next) =>
			logoutAndClearAuth(req, res, next)(dependencies)()
		)
	);
};
