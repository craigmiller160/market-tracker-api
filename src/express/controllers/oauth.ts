import { secure, secureReaderTask } from '../auth/secure';
import * as oAuthService from '../../services/routes/OAuthService';
import * as Reader from 'fp-ts/Reader';
import { Controller } from './Controller';
import { readerTaskRouteToReaderRoute } from '../readerTaskRouteToReaderRoute';

export const getAuthUser: Controller = secure(oAuthService.getAuthUser);

export const getAuthCodeLogin: Controller = Reader.of(
	oAuthService.getAuthCodeLogin
);

export const authCodeAuthentication: Controller = readerTaskRouteToReaderRoute(
	oAuthService.authCodeAuthentication
);

export const logout: Controller = secureReaderTask(
	oAuthService.logoutAndClearAuth
);
