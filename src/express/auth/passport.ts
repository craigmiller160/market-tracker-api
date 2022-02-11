import { logger } from '../../logger';
import { Strategy as JwtStrategy, StrategyOptions } from 'passport-jwt';
import passport from 'passport';
import { pipe } from 'fp-ts/function';
import { UnauthorizedError } from '../../error/UnauthorizedError';
import { AccessToken } from './AccessToken';
import * as Pred from 'fp-ts/Predicate';
import { jwtFromRequest } from './jwt';
import {
	IOT,
	IOTryT,
	OptionT,
	ReaderT
} from '@craigmiller160/ts-functions/types';
import { ExpressDependencies } from '../ExpressDependencies';
import * as Process from '@craigmiller160/ts-functions/Process';
import { getRequiredValues } from '../../function/Values';
import * as IO from 'fp-ts/IO';
import * as IOEither from 'fp-ts/IOEither';

interface ClientKeyName {
	readonly clientKey: string;
	readonly clientName: string;
}

const getClientKeyAndName = (): IOTryT<ClientKeyName> => {
	const envArray: ReadonlyArray<IOT<OptionT<string>>> = [
		Process.envLookupO('CLIENT_KEY'),
		Process.envLookupO('CLIENT_NAME')
	];

	return pipe(
		IO.sequenceArray(envArray),
		IO.map(getRequiredValues),
		IOEither.map(
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
				IOEither.filterOrElse<Error, ClientKeyName>(
					doValidatePayload,
					() =>
						new UnauthorizedError(
							'Invalid token payload attributes'
						)
				),
				IOEither.fold(
					(ex) => () => {
						// something
						done(ex, null);
					},
					() => () => {
						done(null, payload);
					}
				)
			)();
		})
	);
};
