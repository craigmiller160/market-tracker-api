import { Route } from '../Route';
import passport from 'passport';

export const secure2 = (route: Route): Route =>
	passport.authenticate('jwt', { session: false }, route);
