import { NextFunction, Request, Response } from 'express';
import { AccessToken } from '../../express/auth/AccessToken';
import { pipe } from 'fp-ts/function';
import * as Either from 'fp-ts/Either';
import {
	AuthCodeLoginResponse,
	prepareAuthCodeLogin
} from '../auth/AuthCodeLogin';
import { ReaderTaskT } from '@craigmiller160/ts-functions/types';
import { authenticateWithAuthCode } from '../auth/AuthCodeAuthentication';
import { logout } from '../auth/Logout';
import { errorReaderTask } from '../../function/Route';
import { ExpressDependencies } from '../../express/ExpressDependencies';
import * as ReaderTaskEither from 'fp-ts/ReaderTaskEither';
import * as ReaderTask from 'fp-ts/ReaderTask';

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
): void =>
	pipe(
		prepareAuthCodeLogin(req),
		Either.fold(
			(ex) => next(ex),
			(url) => {
				const response: AuthCodeLoginResponse = {
					url
				};
				res.json(response);
			}
		)
	);

export const authCodeAuthentication = (
	req: Request,
	res: Response,
	next: NextFunction
): ReaderTaskT<ExpressDependencies, string> =>
	pipe(
		authenticateWithAuthCode(req),
		ReaderTaskEither.fold(errorReaderTask(next), (authCodeSuccess) => {
			res.setHeader('Set-Cookie', authCodeSuccess.cookie);
			res.setHeader('Location', authCodeSuccess.postAuthRedirect);
			res.status(302);
			res.end();
			return ReaderTask.of('');
		})
	);

export const logoutAndClearAuth = (
	req: Request,
	res: Response,
	next: NextFunction
): ReaderTaskT<ExpressDependencies, string> =>
	pipe(
		logout(req),
		ReaderTaskEither.fold(errorReaderTask(next), (cookie) => {
			res.setHeader('Set-Cookie', cookie);
			res.status(204);
			res.end();
			return ReaderTask.of('');
		})
	);
