import { NextFunction, Request, Response } from 'express';
import { AccessToken } from '../../express/auth/AccessToken';
import { pipe } from 'fp-ts/function';
import * as Either from 'fp-ts/Either';
import {
	AuthCodeLoginResponse,
	prepareAuthCodeLogin
} from '../auth/AuthCodeLogin';
import { TaskT, ReaderTaskT } from '@craigmiller160/ts-functions/types';
import { authenticateWithAuthCode } from '../auth/AuthCodeAuthentication';
import { logout } from '../auth/Logout';
import * as TaskEither from 'fp-ts/TaskEither';
import * as Task from 'fp-ts/Task';
import { errorTask } from '../../function/Route';
import { ExpressDependencies } from '../../express/ExpressDependencies';

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
): TaskT<string> =>
	pipe(
		prepareAuthCodeLogin(req),
		Either.fold(errorTask(next), (url) => {
			const response: AuthCodeLoginResponse = {
				url
			};
			res.json(response);
			return Task.of('');
		})
	);

export const authCodeAuthentication = (
	req: Request,
	res: Response,
	next: NextFunction
): TaskT<string> =>
	pipe(
		authenticateWithAuthCode(req),
		TaskEither.fold(errorTask(next), (authCodeSuccess) => {
			res.setHeader('Set-Cookie', authCodeSuccess.cookie);
			res.setHeader('Location', authCodeSuccess.postAuthRedirect);
			res.status(302);
			res.end();
			return Task.of('');
		})
	);

export const logoutAndClearAuth =
	(
		req: Request,
		res: Response,
		next: NextFunction
	): ReaderTaskT<ExpressDependencies, string> =>
	(dependencies) =>
		pipe(
			logout(req)(dependencies), // TODO try to use Reader functions to avoid drilling
			TaskEither.fold(errorTask(next), (cookie) => {
				res.setHeader('Set-Cookie', cookie);
				res.status(204);
				res.end();
				return Task.of('');
			})
		);
