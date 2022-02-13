import { Route } from '../Route';
import passport from 'passport';
import { Request, Response, NextFunction } from 'express';

export const secure2 = (
	req: Request,
	res: Response,
	next: NextFunction
) =>
	passport.authenticate(
		'jwt',
		{ session: false },
		(error, user, tokenError) => {
			console.log('URL', req.originalUrl);
			next(tokenError);
		}
	)(req, res, next);
