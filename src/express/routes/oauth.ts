import { RouteCreator } from './RouteCreator';
import { secure } from '../auth/secure';
import { pipe } from 'fp-ts/function';
import * as TE from 'fp-ts/TaskEither';
import * as T from 'fp-ts/Task';
import { authenticateWithAuthCode } from '../../services/auth/AuthCodeAuthentication';
import { logout } from '../../services/auth/Logout';
import {
	getAuthCodeLogin,
	getAuthUser
} from '../../services/routes/OAuthService';

export const createOAuthRoutes: RouteCreator = (dependencies) => {
	dependencies.expressApp.get(
		'/oauth/user',
		secure((req, res) => getAuthUser(req, res))
	);

	dependencies.expressApp.post('/oauth/authcode/login', (req, res, next) =>
		getAuthCodeLogin(req, res, next)
	);

	dependencies.expressApp.get('/oauth/authcode/code', (req, res, next) =>
		pipe(
			authenticateWithAuthCode(req),
			TE.fold(
				(ex) => {
					next(ex);
					return T.of('');
				},
				(authCodeSuccess) => {
					res.setHeader('Set-Cookie', authCodeSuccess.cookie);
					res.setHeader('Location', authCodeSuccess.postAuthRedirect);
					res.status(302);
					res.end();
					return T.of('');
				}
			)
		)()
	);

	dependencies.expressApp.get(
		'/oauth/logout',
		secure((req, res, next) =>
			pipe(
				logout(req),
				TE.fold(
					(ex) => {
						next(ex);
						return T.of('');
					},
					(cookie) => {
						res.setHeader('Set-Cookie', cookie);
						res.status(204);
						res.end();
						return T.of('');
					}
				)
			)()
		)
	);
};
