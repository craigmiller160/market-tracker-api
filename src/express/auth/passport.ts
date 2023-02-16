import { logger } from '../../logger';
import { Strategy as JwtStrategy, StrategyOptions } from 'passport-jwt';
import passport from 'passport';
import { AccessToken } from './AccessToken';
import { jwtFromRequest } from './jwt';
import { ReaderT } from '@craigmiller160/ts-functions/types';
import { ExpressDependencies } from '../ExpressDependencies';

export const createPassportValidation: ReaderT<ExpressDependencies, void> = ({
	tokenKey
}) => {
	logger.debug('Creating passport JWT validation strategy')();
	const options: StrategyOptions = {
		secretOrKey: tokenKey.key,
		jwtFromRequest
	};

	passport.use(
		new JwtStrategy(options, (payload: AccessToken, done) => {
			done(null, payload);
		})
	);
};
