import passport from 'passport';
import { logAndReturn } from '../../logger';
import { NextFunction, Request, Response } from 'express';
import { expressErrorHandler } from '../expressErrorHandler';
import { pipe } from 'fp-ts/function';
import * as Option from 'fp-ts/Option';
import { match } from 'ts-pattern';
import { refreshExpiredToken } from '../../services/auth/RefreshExpiredToken';
import * as TaskEither from 'fp-ts/TaskEither';
import * as ReaderTask from 'fp-ts/ReaderTask';
import * as RArray from 'fp-ts/ReadonlyArray';
import { isJwtInCookie, jwtFromRequest } from './jwt';
import { AccessToken } from './AccessToken';
import { Route } from '../Route';
import * as Text from '@craigmiller160/ts-functions/Text';
import { UnauthorizedError } from '../../error/UnauthorizedError';
import * as TaskTry from '@craigmiller160/ts-functions/TaskTry';
import { ReaderT, ReaderTaskT } from '@craigmiller160/ts-functions/types';
import * as ReaderTaskEither from 'fp-ts/ReaderTaskEither';
import { errorReaderTask } from '../../function/Route';
import { ExpressDependencies } from '../ExpressDependencies';
import * as Reader from 'fp-ts/Reader';

interface CookieParts {
	readonly cookie: string;
	readonly cookieName: string;
	readonly cookieValue: string;
}

// TODO figure out a solution that does not involve mutable state
type RefreshFlagRequest = Request & {
	hasRefreshed: boolean | undefined;
};

type SecureCallback = (
	error: Error | null,
	user: AccessToken | boolean,
	tokenError: Error | undefined
) => void;

const secureCallback =
	(
		req: Request,
		res: Response,
		next: NextFunction,
		fn: Route
	): ReaderT<ExpressDependencies, SecureCallback> =>
	(dependencies) =>
	(error, user, tokenError) => {
		pipe(
			Option.fromNullable(error),
			Option.getOrElse(() => tokenError),
			Option.fromNullable,
			Option.fold(
				() => {
					req.user = user as AccessToken;
					fn(req, res, next);
				},
				(realError) =>
					handleTokenError(
						realError,
						req,
						res,
						next,
						fn
					)(dependencies)()
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
): ReaderTaskT<ExpressDependencies, unknown> =>
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
			() => tryToRefreshExpiredToken(req, res, next, fn)
		)
		.otherwise(() => {
			expressErrorHandler(error, req, res, next);
			return ReaderTask.of<ExpressDependencies, string>('');
		});

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
): ReaderTaskT<ExpressDependencies, unknown> => {
	(req as RefreshFlagRequest).hasRefreshed = true;
	return pipe(
		refreshExpiredToken(jwtFromRequest(req)),
		ReaderTaskEither.chainTaskEitherK(splitCookie),
		ReaderTaskEither.map(
			logAndReturn('debug', 'Successfully refreshed token')
		),
		ReaderTaskEither.fold(errorReaderTask(next), (cookieParts) =>
			ReaderTask.asks((deps) => {
				req.headers['Cookie'] = cookieParts.cookie;
				req.cookies[cookieParts.cookieName] = cookieParts.cookieValue;
				res.setHeader('Set-Cookie', cookieParts.cookie);
				secure(fn)(deps)(req, res, next);
				return '';
			})
		)
	);
};

export const secure =
	(fn: Route): ReaderT<ExpressDependencies, Route> =>
	(dependencies) =>
	(req, res, next) => {
		passport.authenticate(
			'jwt',
			{ session: false },
			secureCallback(req, res, next, fn)(dependencies)
		)(req, res, next);
	};

// TODO if it remains unused, delete it
export const secure2: ReaderT<ExpressDependencies, (fn: Route) => Route> =
	Reader.asks((deps) => (fn: Route) => (req, res, next) => {
		passport.authenticate(
			'jwt',
			{ session: false },
			secureCallback(req, res, next, fn)(deps)
		)(req, res, next);
	});
