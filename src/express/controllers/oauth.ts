import { secure, secure2 } from '../auth/secure';
import * as oAuthService from '../../services/routes/OAuthService';
import { ReaderT } from '@craigmiller160/ts-functions/types';
import { ExpressDependencies } from '../ExpressDependencies';
import { Route } from '../Route';
import * as Reader from 'fp-ts/Reader';

export const getAuthUser: ReaderT<ExpressDependencies, Route> = secure(
	oAuthService.getAuthUser
);

export const getAuthCodeLogin: ReaderT<ExpressDependencies, Route> = Reader.of(oAuthService.getAuthCodeLogin);

export const authCodeAuthentication: ReaderT<ExpressDependencies, Route> =
	Reader.asks(
		(deps) => (req, res, next) =>
			oAuthService.authCodeAuthentication(req, res, next)(deps)()
	);
