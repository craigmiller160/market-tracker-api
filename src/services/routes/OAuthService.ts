import { NextFunction, Request, Response } from 'express';
import { AccessToken } from '../../express/auth/AccessToken';
import { pipe } from 'fp-ts/function';
import * as Either from 'fp-ts/Either';
import * as Task from 'fp-ts/Task';
import {
	AuthCodeLoginResponse,
	prepareAuthCodeLogin
} from '../auth/AuthCodeLogin';
import { TaskT } from '@craigmiller160/ts-functions/types';

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
): TaskT<string> => {
	return pipe(
		prepareAuthCodeLogin(req),
		Either.fold(
			(ex) => {
				next(ex);
				return Task.of('');
			},
			(url) => {
				const response: AuthCodeLoginResponse = {
					url
				};
				res.json(response);
				return Task.of('');
			}
		)
	);
};
