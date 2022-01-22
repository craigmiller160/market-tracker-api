import passport from 'passport';
import { logDebug } from '../../logger';
import { NextFunction, Request, Response } from 'express';
import { expressErrorHandler } from '../expressErrorHandler';
import { pipe } from 'fp-ts/function';
import * as Option from 'fp-ts/Option';
import { match } from 'ts-pattern';
import { refreshExpiredToken } from '../../services/auth/RefreshExpiredToken';
import * as TaskEither from 'fp-ts/TaskEither';
import * as Task from 'fp-ts/Task';
import * as RArray from 'fp-ts/ReadonlyArray';
import { isJwtInCookie, jwtFromRequest } from './jwt';
import { AccessToken } from './AccessToken';
import { Route } from '../Route';
import * as Text from '@craigmiller160/ts-functions/Text';
import { UnauthorizedError } from '../../error/UnauthorizedError';
import * as TaskTry from '@craigmiller160/ts-functions/TaskTry';

interface CookieParts {
	readonly cookie: string;
	readonly cookieName: string;
	readonly cookieValue: string;
}

type RefreshFlagRequest = Request & {
	hasRefreshed: boolean | undefined;
};

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

const hasRefreshAlreadyHappened = (req: Request): boolean =>
	(req as RefreshFlagRequest).hasRefreshed ?? false;

const handleTokenError = (
	error: Error,
	req: Request,
	res: Response,
	next: NextFunction,
	fn: Route
): unknown =>
	match({
		error,
		jwtIsInCookie: isJwtInCookie(req),
		refreshAlreadyHappened: hasRefreshAlreadyHappened(req)
	})
		.with(
			{
				error: { name: 'TokenExpiredError' },
				jwtIsInCookie: true,
				refreshAlreadyHappened: false
			},
			tryToRefreshExpiredToken(req, res, next, fn)
		)
		.otherwise(() => expressErrorHandler(error, req, res, next));

const splitCookie = (cookie: string): TaskTry.TaskTry<CookieParts> =>
	pipe(
		cookie,
		Text.split(';'),
		RArray.head,
		Option.map(Text.split('=')),
		Option.filter((_) => _.length === 2),
		Option.map(
			([cookieName, cookieValue]): CookieParts => ({
				cookie,
				cookieName,
				cookieValue
			})
		),
		TaskEither.fromOption(
			() => new UnauthorizedError('Unable to prepare cookie')
		)
	);

const tryToRefreshExpiredToken = (
	req: Request,
	res: Response,
	next: NextFunction,
	fn: Route
): Task.Task<unknown> => {
	(req as RefreshFlagRequest).hasRefreshed = true;
	return pipe(
		refreshExpiredToken(jwtFromRequest(req)),
		TaskEither.chain(splitCookie),
		TaskEither.fold(
			(ex) => {
				next(ex);
				return Task.of('');
			},
			(cookieParts) => {
				logDebug('Successfully refreshed token')();
				req.headers['Cookie'] = cookieParts.cookie;
				req.cookies[cookieParts.cookieName] = cookieParts.cookieValue;
				res.setHeader('Set-Cookie', cookieParts.cookie);
				passport.authenticate(
					'jwt',
					{ session: false },
					secureCallback(req, res, next, fn)
				)(req, res, next);
				return Task.of('');
			}
		)
	);
};

export const secure =
	(fn: Route): Route =>
	(req, res, next) => {
		passport.authenticate(
			'jwt',
			{ session: false },
			secureCallback(req, res, next, fn)
		)(req, res, next);
	};
