import passport from 'passport';
import { Request, Response, NextFunction } from 'express';
import { AccessToken } from './AccessToken';
import * as Option from 'fp-ts/Option';
import { OptionT, ReaderTaskT } from '@craigmiller160/ts-functions/types';
import { pipe } from 'fp-ts/function';
import { match } from 'ts-pattern';
import { AppRefreshTokenRepository } from '../../data/repo/AppRefreshTokenRepository';
import * as mongoRefreshTokenRepo from '../../data/repo/mongo/MongoAppRefreshTokenRepository';
import * as ReaderTask from 'fp-ts/ReaderTask';
import { isJwtInCookie } from './jwt';

// TODO use this as another middleware, as opposed to wrapping the request
// TODO perform the refresh and set the response cookie
// TODO call next() to propagate to the actual handler

interface SecureDependencies {
	readonly req: Request;
	readonly res: Response;
	readonly next: NextFunction;
	readonly refreshTokenRepo: AppRefreshTokenRepository;
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

// TODO finish this
const tryToRefreshExpiredToken = (): ReaderTaskT<SecureDependencies, void> => {
	throw new Error();
};

// TODO need to pass hasRefreshed in, plus probably req/res/next
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

// TODO how to I get the ExpressDependencies here? Specifically the refresh token repo?
// TODO I'm going to have to connect this to the broader Reader chain to get the repo
export const secure2 = (
	req: Request,
	res: Response,
	next: NextFunction
): void =>
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
							hasRefreshed: false,
							refreshTokenRepo: mongoRefreshTokenRepo
						})()
				)
			);
		}
	)(req, res, next);
