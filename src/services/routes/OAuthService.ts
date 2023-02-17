import { NextFunction, Request, Response } from 'express';
import { pipe } from 'fp-ts/function';
import {
	AuthCodeLoginResponse,
	prepareAuthCodeLogin
} from '../auth/AuthCodeLogin';
import { IOT, ReaderT, ReaderTaskT } from '@craigmiller160/ts-functions/types';
import { authenticateWithAuthCode } from '../auth/AuthCodeAuthentication';
import { logout } from '../auth/Logout';
import { errorReaderTask } from '../../function/Route';
import {
	ExpressDependencies,
	ExpressRouteDependencies
} from '../../express/ExpressDependencies';
import * as ReaderTaskEither from 'fp-ts/ReaderTaskEither';
import * as IOEither from 'fp-ts/IOEither';
import { TaskRoute } from '../../express/Route';
import * as Reader from 'fp-ts/Reader';

export const getAuthUser = (req: Request, res: Response): void => {
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

export const getAuthCodeLogin = (
	req: Request,
	res: Response,
	next: NextFunction
): IOT<void> =>
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

export const authCodeAuthentication: ReaderT<
	ExpressRouteDependencies,
	TaskRoute
> = Reader.asks(
	(deps) => (req: Request, res: Response, next: NextFunction) =>
		pipe(
			authenticateWithAuthCode(req),
			ReaderTaskEither.fold(
				errorReaderTask(next),
				(authCodeSuccess) => () => async () => {
					res.setHeader('Set-Cookie', authCodeSuccess.cookie);
					res.setHeader('Location', authCodeSuccess.postAuthRedirect);
					res.status(302);
					res.end();
				}
			)
		)(deps)
);

export const logoutAndClearAuth: ReaderT<ExpressRouteDependencies, TaskRoute> =
	Reader.asks(
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
	);
