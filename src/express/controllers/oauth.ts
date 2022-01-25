import { secure } from '../auth/secure';
import * as oAuthService from '../../services/routes/OAuthService';
import { ReaderT, TaskT } from '@craigmiller160/ts-functions/types';
import { ExpressDependencies } from '../ExpressDependencies';
import { Route } from '../Route';
import * as Reader from 'fp-ts/Reader';
import * as Task from 'fp-ts/Task';
import { Request, Response, NextFunction } from 'express';

export const getAuthUser: ReaderT<ExpressDependencies, Route> = secure(
	oAuthService.getAuthUser
);

export const getAuthCodeLogin: Route = oAuthService.getAuthCodeLogin;

export const authCodeAuthentication: ReaderT<ExpressDependencies, Route> =
	Reader.asks(
		(deps) => (req, res, next) =>
			oAuthService.authCodeAuthentication(req, res, next)(deps)()
	);

// TODO clean up below here

const doSomething = (
	req: Request,
	res: Response,
	next: NextFunction
): TaskT<string> => {
	return Task.of('');
};

const temp =
	(deps: ExpressDependencies): Route =>
	(req, res, next) =>
		doSomething(req, res, next)();

export const authCodeAuthentication2: ReaderT<ExpressDependencies, Route> =
	Reader.asks(temp);
