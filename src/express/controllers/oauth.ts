import { secure, secureReaderTask } from '../auth/secure';
import * as oAuthService from '../../services/routes/OAuthService';
import { Controller } from './Controller';
import { readerTaskRouteToReaderRoute } from '../readerTaskRouteToReaderRoute';
import { ioRouteToReaderRoute } from '../ioRouteToReaderRoute';

export const getAuthUser: Controller = secure(oAuthService.getAuthUser);

export const getAuthCodeLogin: Controller = ioRouteToReaderRoute(
	oAuthService.getAuthCodeLogin
);

export const authCodeAuthentication: Controller = readerTaskRouteToReaderRoute(
	oAuthService.authCodeAuthentication
);

export const logout: Controller = secureReaderTask(
	oAuthService.logoutAndClearAuth
);
