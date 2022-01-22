import { TokenKey } from '../../services/auth/TokenKey';
import { logger } from '../../logger';
import { Strategy as JwtStrategy, StrategyOptions } from 'passport-jwt';
import passport from 'passport';
import { pipe } from 'fp-ts/function';
import * as Either from 'fp-ts/Either';
import { UnauthorizedError } from '../../error/UnauthorizedError';
import { AccessToken } from '../TokenValidation';
import * as Pred from 'fp-ts/Predicate';
import * as Try from '@craigmiller160/ts-functions/Try';
import * as RArr from 'fp-ts/ReadonlyArray';
import * as Option from 'fp-ts/Option';
import { jwtFromRequest } from './jwt';

interface ClientKeyName {
	readonly clientKey: string;
	readonly clientName: string;
}

const getClientKeyAndName = (): Try.Try<ClientKeyName> => {
	const envArray: ReadonlyArray<string | undefined> = [
		process.env.CLIENT_KEY,
		process.env.CLIENT_NAME
	];

	return pipe(
		envArray,
		RArr.map(Option.fromNullable),
		Option.sequenceArray,
		Option.map(
			([clientKey, clientName]): ClientKeyName => ({
				clientKey,
				clientName
			})
		),
		Either.fromOption(
			() =>
				new UnauthorizedError(
					`Missing required environment variables for token property validation: ${envArray}`
				)
		)
	);
};

const validatePayload = (token: AccessToken): Pred.Predicate<ClientKeyName> =>
	pipe(
		(keyAndName: ClientKeyName) => keyAndName.clientKey === token.clientKey,
		Pred.and((keyAndName) => keyAndName.clientName === token.clientName)
	);

export const createPassportValidation = (tokenKey: TokenKey) => {
	logger.debug('Creating passport JWT validation strategy');
	const options: StrategyOptions = {
		secretOrKey: tokenKey.key,
		jwtFromRequest
	};

	passport.use(
		new JwtStrategy(options, (payload: AccessToken, done) => {
			const doValidatePayload = validatePayload(payload);
			pipe(
				getClientKeyAndName(),
				Either.filterOrElse<ClientKeyName, Error>(
					doValidatePayload,
					() =>
						new UnauthorizedError(
							'Invalid token payload attributes'
						)
				),
				Either.fold(
					(ex) => done(ex, null),
					() => done(null, payload)
				)
			);
		})
	);
};
