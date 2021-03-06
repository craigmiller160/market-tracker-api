import passport from 'passport';
import { Request, Response, NextFunction } from 'express';
import { AccessToken } from './AccessToken';
import * as Option from 'fp-ts/Option';
import {
	OptionT,
	ReaderT,
	ReaderTaskT,
	TaskTryT
} from '@craigmiller160/ts-functions/types';
import { pipe } from 'fp-ts/function';
import { match } from 'ts-pattern';
import { AppRefreshTokenRepository } from '../../data/repo/AppRefreshTokenRepository';
import * as ReaderTask from 'fp-ts/ReaderTask';
import { isJwtInCookie, jwtFromRequest } from './jwt';
import * as ReaderTaskEither from 'fp-ts/ReaderTaskEither';
import { logger } from '../../logger';
import { refreshExpiredToken } from '../../services/auth/RefreshExpiredToken';
import * as Text from '@craigmiller160/ts-functions/Text';
import * as RArray from 'fp-ts/ReadonlyArray';
import * as TaskEither from 'fp-ts/TaskEither';
import { UnauthorizedError } from '../../error/UnauthorizedError';
import { Route } from '../Route';

interface CookieParts {
	readonly cookie: string;
	readonly cookieName: string;
	readonly cookieValue: string;
}

interface CreateSecureDependencies {
	readonly appRefreshTokenRepository: AppRefreshTokenRepository;
	readonly hasRefreshed: boolean;
}

interface SecureDependencies {
	readonly req: Request;
	readonly res: Response;
	readonly next: NextFunction;
	readonly appRefreshTokenRepository: AppRefreshTokenRepository;
	readonly hasRefreshed: boolean;
}

const getError = (
	error: Error | null,
	tokenError: Error | undefined
): OptionT<Error> =>
	pipe(
		Option.fromNullable(error),
		Option.getOrElse(() => tokenError),
		Option.fromNullable
	);

const splitCookie = (cookie: string): TaskTryT<CookieParts> =>
	pipe(
		Text.split(';')(cookie),
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

const tryToRefreshExpiredToken = (): ReaderTaskT<SecureDependencies, void> => {
	return pipe(
		logger.debug('Attempting to refresh expired token'),
		ReaderTaskEither.rightIO,
		ReaderTaskEither.chain(() =>
			ReaderTaskEither.asks<SecureDependencies, Request>(({ req }) => req)
		),
		ReaderTaskEither.chainW((req) =>
			refreshExpiredToken(jwtFromRequest(req))
		),
		ReaderTaskEither.chainTaskEitherK(splitCookie),
		ReaderTaskEither.chainFirstIOK(() =>
			logger.debug('Successfully refreshed token')
		),
		ReaderTaskEither.fold(
			(ex) => ReaderTask.asks(({ next }) => next(ex)),
			(cookieParts) =>
				ReaderTask.asks(
					({ req, res, next, appRefreshTokenRepository }) => {
						req.headers['Cookie'] = cookieParts.cookie;
						req.cookies[cookieParts.cookieName] =
							cookieParts.cookieValue;
						res.setHeader('Set-Cookie', cookieParts.cookie);
						createSecure({
							appRefreshTokenRepository,
							hasRefreshed: true
						})(req, res, next);
					}
				)
		)
	);
};

const handleTokenError = (
	error: Error,
	next: NextFunction
): ReaderTaskT<SecureDependencies, void> =>
	pipe(
		ReaderTask.asks<
			SecureDependencies,
			{ hasRefreshed: boolean; req: Request }
		>(({ hasRefreshed, req }) => ({
			hasRefreshed,
			req
		})),
		ReaderTask.chain(({ hasRefreshed, req }) =>
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
					() => tryToRefreshExpiredToken()
				)
				.otherwise(() => () => async () => next(error))
		)
	);

export const createSecure: ReaderT<CreateSecureDependencies, Route> =
	({ hasRefreshed, appRefreshTokenRepository }) =>
	(req, res, next) =>
		passport.authenticate(
			'jwt',
			{ session: false },
			(
				error: Error | null,
				user: AccessToken | boolean,
				tokenError: Error | undefined
			) => {
				pipe(
					getError(error, tokenError),
					Option.fold(
						() => {
							req.user = user as AccessToken;
							next();
						},
						(realError) =>
							handleTokenError(
								realError,
								next
							)({
								req,
								res,
								next,
								hasRefreshed,
								appRefreshTokenRepository
							})()
					)
				);
			}
		)(req, res, next);
