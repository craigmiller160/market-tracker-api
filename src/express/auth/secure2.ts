import passport from 'passport';
import { Request, Response, NextFunction } from 'express';

// TODO use this as another middleware, as opposed to wrapping the request
// TODO perform the refresh and set the response cookie
// TODO call next() to propagate to the actual handler

export const secure2 = (
	req: Request,
	res: Response,
	next: NextFunction
): void =>
	passport.authenticate(
		'jwt',
		{ session: false },
		(error, user, tokenError) => {
			// req.originalUrl
			// req.method
			next();
		}
	)(req, res, next);
