import passport from 'passport';
import { Request, Response, NextFunction } from 'express';
import { AccessToken } from './AccessToken';
import * as Option from 'fp-ts/Option';
import { OptionT } from '@craigmiller160/ts-functions/types';
import { pipe } from 'fp-ts/function';
import { match } from 'ts-pattern';
import { isJwtInCookie } from './jwt';

// TODO use this as another middleware, as opposed to wrapping the request
// TODO perform the refresh and set the response cookie
// TODO call next() to propagate to the actual handler

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
const tryToRefreshExpiredToken = () => {
	throw new Error();
};

// TODO need to pass hasRefreshed in, plus probably req/res/next
const handleTokenError = (error: Error, next: NextFunction) => {
	match({ error, jwtIsInCookie: false, refreshAlreadyHappened: false })
		.with(
			{
				error: { name: 'TokenExpiredError' },
				jwtIsInCookie: true,
				refreshAlreadyHappened: false
			},
			() => tryToRefreshExpiredToken()
		)
		.otherwise(() => next(error));
};

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
					(realError) => handleTokenError(realError, next)
				)
			);
		}
	)(req, res, next);
