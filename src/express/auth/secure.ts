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
import { ReaderTaskRoute, Route, TaskRoute } from '../Route';
import * as Text from '@craigmiller160/ts-functions/Text';
import { UnauthorizedError } from '../../error/UnauthorizedError';
import {
	ReaderT,
	ReaderTaskT,
	TaskTryT
} from '@craigmiller160/ts-functions/types';
import * as ReaderTaskEither from 'fp-ts/ReaderTaskEither';
import { errorReaderTask } from '../../function/Route';
import { ExpressDependencies } from '../ExpressDependencies';

interface CookieParts {
	readonly cookie: string;
	readonly cookieName: string;
	readonly cookieValue: string;
}

interface HasRefreshed {
	readonly hasRefreshed?: boolean;
}

type SecureExpressDependencies = ExpressDependencies & HasRefreshed;

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

const handleTokenError = (
	error: Error,
	req: Request,
	res: Response,
	next: NextFunction,
	fn: Route
): ReaderTaskT<SecureExpressDependencies, unknown> =>
	pipe(
		ReaderTask.asks<SecureExpressDependencies, boolean>(
			({ hasRefreshed }) => hasRefreshed ?? false
		),
		ReaderTask.chain((hasRefreshed) =>
			match({
				error,
				jwtIsInCookie: isJwtInCookie(req),
				refreshAlreadyHappened: hasRefreshed
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
				})
		)
	);

const splitCookie = (cookie: string): TaskTryT<CookieParts> =>
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
): ReaderTaskT<SecureExpressDependencies, unknown> =>
	pipe(
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
				secure(fn)({
					...deps,
					hasRefreshed: true
				})(req, res, next);
				return '';
			})
		)
	);

const createNewDependencies = (
	dependencies: SecureExpressDependencies
): SecureExpressDependencies => ({
	...dependencies,
	hasRefreshed: dependencies.hasRefreshed ?? false
});

export const secure =
	(fn: Route): ReaderT<SecureExpressDependencies, Route> =>
	(dependencies) =>
	(req, res, next) => {
		const newDeps = createNewDependencies(dependencies);
		passport.authenticate(
			'jwt',
			{ session: false },
			secureCallback(req, res, next, fn)(newDeps)
		)(req, res, next);
	};

export const secureTask =
	<T>(fn: TaskRoute<T>): ReaderT<SecureExpressDependencies, Route> =>
	(dependencies) =>
	(req, res, next) => {
		const newDeps = createNewDependencies(dependencies);
		const wrappedFn: Route = (
			req: Request,
			res: Response,
			next: NextFunction
		) => fn(req, res, next)();
		passport.authenticate(
			'jwt',
			{ session: false },
			secureCallback(req, res, next, wrappedFn)(newDeps)
		)(req, res, next);
	};

export const secureReaderTask =
	<T>(fn: ReaderTaskRoute<T>): ReaderT<SecureExpressDependencies, Route> =>
	(dependencies) =>
	(req, res, next) => {
		const newDeps = createNewDependencies(dependencies);
		const wrappedFn: Route = (
			req: Request,
			res: Response,
			next: NextFunction
		) => fn(req, res, next)(newDeps)();
		passport.authenticate(
			'jwt',
			{ session: false },
			secureCallback(req, res, next, wrappedFn)(newDeps)
		)(req, res, next);
	};
