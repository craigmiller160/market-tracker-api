import { secure } from '../auth/secure';
import * as oAuthService from '../../services/routes/OAuthService';
import { ReaderT } from '@craigmiller160/ts-functions/types';
import { ExpressDependencies } from '../ExpressDependencies';
import { Route } from '../Route';

export const getAuthUser: ReaderT<ExpressDependencies, Route> = secure(
	oAuthService.getAuthUser
);

export const getAuthCodeLogin: Route = oAuthService.getAuthCodeLogin;

export const authCodeAuthentication: ReaderT<ExpressDependencies, Route> = (
	dependencies
): Route => {
	// TODO cleanup
	return (req, res, next) =>
		oAuthService.authCodeAuthentication(req, res, next)(dependencies)();
};
