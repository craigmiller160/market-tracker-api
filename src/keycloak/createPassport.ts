import { TokenValidationConfig } from './getTokenValidationConfig';
import passport from 'passport';
import {
	JwtFromRequestFunction,
	SecretOrKeyProvider,
	Strategy as JwtStrategy,
	StrategyOptions
} from 'passport-jwt';
import { logger } from '../logger';
import { TryT } from '@craigmiller160/ts-functions/types';
import { Json, Try } from '@craigmiller160/ts-functions';
import { flow, pipe } from 'fp-ts/function';
import * as Either from 'fp-ts/Either';
import * as Option from 'fp-ts/Option';

type JwtHeader = {
	readonly alg: string;
	readonly typ: string;
	readonly kid: string;
};

const jwtFromRequest: JwtFromRequestFunction = (req) =>
	req.header('Authorization')?.replace('Bearer ', '') ?? null;

const getHeader = (jwt: string): TryT<JwtHeader> =>
	pipe(
		Try.tryCatch(() => Buffer.from(jwt.split('.')[0], 'utf8').toString()),
		Either.chain((rawHeader: string) => Json.parseE<JwtHeader>(rawHeader))
	);

const getKey = (keys: Record<string, string>, jwt: string): TryT<string> =>
	pipe(
		getHeader(jwt),
		Either.map((header) => header.kid),
		Either.map((kid) => keys[kid]),
		Either.chain(
			flow(
				Option.fromNullable,
				Either.fromOption(() => new Error('No matching key for JWT'))
			)
		)
	);

const createSecretOrKeyProvider =
	(keys: Record<string, string>): SecretOrKeyProvider =>
	(req, jwt, done) =>
		pipe(
			getKey(keys, jwt.toString()),
			Either.fold(
				(ex) => done(ex),
				(key) => done(null, key)
			)
		);

export const createPassport = (
	tokenValidationConfig: TokenValidationConfig
) => {
	logger.debug('Creating passport JWT validation strategy')();
	const options: StrategyOptions = {
		jwtFromRequest,
		secretOrKeyProvider: createSecretOrKeyProvider(
			tokenValidationConfig.keys
		),
		issuer: tokenValidationConfig.issuer
	};

	passport.use(
		new JwtStrategy(options, (payload, done) => done(null, payload))
	);
};
