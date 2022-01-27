import { secure, secureReaderTask } from '../auth/secure';
import * as oAuthService from '../../services/routes/OAuthService';
import * as Reader from 'fp-ts/Reader';
import { Controller } from './Controller';
import { NextFunction, Response, Request } from 'express';
import { ReaderTaskT } from '@craigmiller160/ts-functions/types'
import { ExpressDependencies } from '../ExpressDependencies';
import { ReaderTaskRoute } from '../Route';

export const getAuthUser: Controller = secure(oAuthService.getAuthUser);

export const getAuthCodeLogin: Controller = Reader.of(
	oAuthService.getAuthCodeLogin
);

// TODO take care of this... somehow
const foo: ReaderTaskRoute<string> = (req: Request, res: Response, next: NextFunction): ReaderTaskT<ExpressDependencies, string> =>
	oAuthService.authCodeAuthentication(req, res, next);

export const authCodeAuthentication: Controller = Reader.asks(
	(deps) => (req, res, next) =>
		oAuthService.authCodeAuthentication(req, res, next)(deps)()
);

export const logout: Controller = secureReaderTask(
	oAuthService.logoutAndClearAuth
);
