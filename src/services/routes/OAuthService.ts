import { NextFunction, Request, Response } from 'express';
import { AccessToken } from '../../express/auth/AccessToken';
import { pipe } from 'fp-ts/function';
import {
	AuthCodeLoginResponse,
	prepareAuthCodeLogin
} from '../auth/AuthCodeLogin';
import { ReaderT, ReaderTaskT } from '@craigmiller160/ts-functions/types';
import { authenticateWithAuthCode } from '../auth/AuthCodeAuthentication';
import { logout } from '../auth/Logout';
import { errorReaderTask } from '../../function/Route';
import {
	ExpressDependencies,
	ExpressRouteDependencies
} from '../../express/ExpressDependencies';
import * as ReaderTaskEither from 'fp-ts/ReaderTaskEither';
import * as IOEither from 'fp-ts/IOEither';
import {
	IORoute,
	ioRouteToRoute,
	Route,
	TaskRoute,
	taskRouteToRoute
} from '../../express/Route';
import * as Reader from 'fp-ts/Reader';

export const getAuthUser: Route = (req, res) => {
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
};

const doGetAuthCodeLogin: IORoute = (
	req: Request,
	res: Response,
	next: NextFunction
) =>
	pipe(
		prepareAuthCodeLogin(req),
		IOEither.fold(
			(ex) => () => next(ex),
			(url) => () => {
				const response: AuthCodeLoginResponse = {
					url
				};
				res.json(response);
			}
		)
	);

export const getAuthCodeLogin: Route = pipe(doGetAuthCodeLogin, ioRouteToRoute);

export const authCodeAuthentication: ReaderT<ExpressRouteDependencies, Route> =
	pipe(
		Reader.asks<ExpressRouteDependencies, TaskRoute>(
			(deps) => (req: Request, res: Response, next: NextFunction) =>
				pipe(
					authenticateWithAuthCode(req),
					ReaderTaskEither.fold(
						errorReaderTask(next),
						(authCodeSuccess) => () => async () => {
							res.setHeader('Set-Cookie', authCodeSuccess.cookie);
							res.setHeader(
								'Location',
								authCodeSuccess.postAuthRedirect
							);
							res.status(302);
							res.end();
						}
					)
				)(deps)
		),
		Reader.map(taskRouteToRoute)
	);

export const logoutAndClearAuth: ReaderT<ExpressRouteDependencies, Route> =
	pipe(
		Reader.asks<ExpressRouteDependencies, TaskRoute>(
			(deps) => (req: Request, res: Response, next: NextFunction) =>
				pipe(
					logout(req),
					ReaderTaskEither.fold(
						errorReaderTask(next),
						(cookie): ReaderTaskT<ExpressDependencies, void> =>
							() =>
							async () => {
								res.setHeader('Set-Cookie', cookie);
								res.status(204);
								res.end();
							}
					)
				)(deps)
		),
		Reader.map(taskRouteToRoute)
	);
