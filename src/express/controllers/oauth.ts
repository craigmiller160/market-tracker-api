import { secure, secureReaderTask } from '../auth/secure';
import * as oAuthService from '../../services/routes/OAuthService';
import * as Reader from 'fp-ts/Reader';
import { Controller } from './Controller';

export const getAuthUser: Controller = secure(oAuthService.getAuthUser);

export const getAuthCodeLogin: Controller = Reader.of(
	oAuthService.getAuthCodeLogin
);

export const authCodeAuthentication: Controller = Reader.asks(
	(deps) => (req, res, next) =>
		oAuthService.authCodeAuthentication(req, res, next)(deps)()
);

export const logout: Controller = secureReaderTask(
	oAuthService.logoutAndClearAuth
);
