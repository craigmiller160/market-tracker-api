import { logger } from '../../logger';
import { Strategy as JwtStrategy, StrategyOptions } from 'passport-jwt';
import passport from 'passport';
import { pipe } from 'fp-ts/function';
import * as Either from 'fp-ts/Either';
import { UnauthorizedError } from '../../error/UnauthorizedError';
import { AccessToken } from './AccessToken';
import * as Pred from 'fp-ts/Predicate';
import * as Try from '@craigmiller160/ts-functions/Try';
import { jwtFromRequest } from './jwt';
import { getRequiredValues } from '../../function/Values';
import { ReaderT } from '@craigmiller160/ts-functions/types';
import { ExpressDependencies } from '../ExpressDependencies';

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
		getRequiredValues(envArray),
		Either.map(
			([clientKey, clientName]): ClientKeyName => ({
				clientKey,
				clientName
			})
		)
	);
};

const validatePayload = (token: AccessToken): Pred.Predicate<ClientKeyName> =>
	pipe(
		(keyAndName: ClientKeyName) => keyAndName.clientKey === token.clientKey,
		Pred.and((keyAndName) => keyAndName.clientName === token.clientName)
	);

export const createPassportValidation: ReaderT<ExpressDependencies, void> = ({
	tokenKey
}) => {
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
