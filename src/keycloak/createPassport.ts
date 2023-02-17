import { TokenValidationConfig } from './getTokenValidationConfig';
import passport from 'passport';
import {
	JwtFromRequestFunction,
	Strategy as JwtStrategy,
	StrategyOptions
} from 'passport-jwt';
import { logger } from '../logger';

const jwtFromRequest: JwtFromRequestFunction = (req) =>
	req.header('Authorization')?.replace('Bearer ', '') ?? null;

export const createPassport = (
	tokenValidationConfig: TokenValidationConfig
) => {
	logger.debug('Creating passport JWT validation strategy')();
	const options: StrategyOptions = {
		jwtFromRequest,
		issuer: tokenValidationConfig.issuer
	};

	passport.use(
		new JwtStrategy(options, (payload, done) => done(null, payload))
	);
};
