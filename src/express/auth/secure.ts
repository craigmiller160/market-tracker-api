import passport from 'passport';
import { logDebug, logError } from '../../logger';
import { NextFunction, Request, Response } from 'express';
import { expressErrorHandler } from '../expressErrorHandler';
import { pipe } from 'fp-ts/function';
import * as Option from 'fp-ts/Option';
import { match } from 'ts-pattern';
import { refreshExpiredToken } from '../../services/auth/RefreshExpiredToken';
import * as TaskEither from 'fp-ts/TaskEither';
import * as Task from 'fp-ts/Task';
import { isJwtInCookie, jwtFromRequest } from './jwt';
import { AccessToken } from './AccessToken';
import { Route } from '../Route';

interface CookieParts {
	readonly cookie: string;
	readonly cookieName: string;
	readonly cookieValue: string;
}

const secureCallback =
	(req: Request, res: Response, next: NextFunction, fn: Route) =>
	(
		error: Error | null,
		user: AccessToken | boolean,
		tokenError: Error | undefined
	) => {
		pipe(
			Option.fromNullable(error),
			Option.getOrElse(() => tokenError),
			Option.fromNullable,
			Option.fold(
				() => {
					req.user = user as AccessToken;
					fn(req, res, next);
				},
				(realError) => handleTokenError(realError, req, res, next, fn)
			)
		);
	};

const handleTokenError = (
	error: Error,
	req: Request,
	res: Response,
	next: NextFunction,
	fn: Route
): unknown =>
	match({ error, shouldRefresh: isJwtInCookie(req) })
		.with(
			{ error: { name: 'TokenExpiredError' }, shouldRefresh: true },
			tryToRefreshExpiredToken(req, res, next, fn)
		)
		.otherwise(() => expressErrorHandler(error, req, res, next));

const splitCookie = (cookie: string): CookieParts => {
	const [cookieName, cookieValue] = cookie.split(';')[0].split('=');
	return {
		cookie,
		cookieName,
		cookieValue
	};
};

const tryToRefreshExpiredToken = (
	req: Request,
	res: Response,
	next: NextFunction,
	fn: Route
): Task.Task<unknown> =>
	pipe(
		refreshExpiredToken(jwtFromRequest(req)),
		TaskEither.map(splitCookie),
		TaskEither.fold(
			(ex) => {
				logError('Error refreshing token', ex)();
				next(ex);
				return Task.of('');
			},
			(cookieParts) => {
				logDebug('Successfully refreshed token')();
				res.setHeader('Set-Cookie', cookieParts.cookie);
				req.headers['Cookie'] = cookieParts.cookie;
				req.cookies[cookieParts.cookieName] = cookieParts.cookieValue;
				passport.authenticate(
					'jwt',
					{ session: false },
					secureCallback(req, res, next, fn)
				)(req, res, next);
				return Task.of('');
			}
		)
	);

export const secure =
	(fn: Route): Route =>
	(req, res, next) => {
		passport.authenticate(
			'jwt',
			{ session: false },
			secureCallback(req, res, next, fn)
		)(req, res, next);
	};
