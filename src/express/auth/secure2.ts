import passport from 'passport';
import { Request, Response, NextFunction } from 'express';
import { AccessToken } from './AccessToken';
import * as Option from 'fp-ts/Option';
import { OptionT } from '@craigmiller160/ts-functions/types';
import { pipe } from 'fp-ts/function';

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

const handleTokenError = (error: Error, next: NextFunction) => {};

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
