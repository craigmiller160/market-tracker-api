import { OldRouteCreator } from './RouteCreator';
import { secure } from '../auth/secure';
import { AccessToken } from '../auth/AccessToken';
import { pipe } from 'fp-ts/function';
import {
	AuthCodeLoginResponse,
	prepareAuthCodeLogin
} from '../../services/auth/AuthCodeLogin';
import * as TE from 'fp-ts/TaskEither';
import * as E from 'fp-ts/Either';
import * as T from 'fp-ts/Task';
import { authenticateWithAuthCode } from '../../services/auth/AuthCodeAuthentication';
import { logout } from '../../services/auth/Logout';

export const createOAuthRoutes: OldRouteCreator = (app) => {
	app.get(
		'/oauth/user',
		secure((req, res) => {
			const token = req.user as AccessToken;
			res.send({
				sub: token.sub,
				clientName: token.clientName,
				firstName: token.firstName,
				lastName: token.lastName,
				userId: token.userId,
				userEmail: token.userEmail,
				roles: token.roles
			});
		})
	);

	app.post('/oauth/authcode/login', (req, res, next) =>
		pipe(
			prepareAuthCodeLogin(req),
			E.fold(
				(ex) => {
					next(ex);
					return T.of('');
				},
				(url) => {
					const response: AuthCodeLoginResponse = {
						url
					};
					res.json(response);
					return T.of('');
				}
			)
		)
	);

	app.get('/oauth/authcode/code', (req, res, next) =>
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

	app.get(
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
