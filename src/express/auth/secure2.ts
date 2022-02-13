import { Route } from '../Route';
import passport from 'passport';

export const secure2 = (): Route =>
	passport.authenticate('jwt', { session: false });
