import { Request } from 'express';
import * as Either from 'fp-ts/Either';
import { pipe } from 'fp-ts/function';
import { randomInt } from 'crypto';
import * as IO from 'fp-ts/IO';
import * as Uri from '@craigmiller160/ts-functions/Uri';
import { getHeader, getMarketTrackerSession } from '../../function/HttpRequest';
import * as Time from '@craigmiller160/ts-functions/Time';
import { STATE_EXP_FORMAT } from './constants';
import { UnauthorizedError } from '../../error/UnauthorizedError';
import { IOT, IOTryT, OptionT, TryT } from '@craigmiller160/ts-functions/types';
import * as Process from '@craigmiller160/ts-functions/Process';
import { getRequiredValues } from '../../function/Values';
import * as IOEither from 'fp-ts/IOEither';

export interface AuthCodeLoginResponse {
	readonly url: string;
}

const AUTH_CODE_LOGIN_PATH = '/ui/login';

const getOrigin = (req: Request): TryT<string> =>
	pipe(
		getHeader(req, 'Origin'),
		Either.fromOption(
			() => new UnauthorizedError('Missing origin header on request')
		)
	);

const storeAuthCodeLoginSessionValues =
	(req: Request, state: number, origin: string): IOT<void> =>
	() => {
		const session = getMarketTrackerSession(req);
		session.state = state;
		session.origin = origin;
		session.stateExpiration = pipe(
			new Date(),
			Time.addMinutes(10),
			Time.format(STATE_EXP_FORMAT)
		);
	};

const createUrl = (
	envVariables: readonly string[],
	origin: string,
	state: number
): Either.Either<Error, string> => {
	const [clientKey, authCodeRedirectUri, authLoginBaseUri] = envVariables;
	const baseUrl = `${origin}${authLoginBaseUri}${AUTH_CODE_LOGIN_PATH}`;
	const fullRedirectUri = `${origin}${authCodeRedirectUri}`;

	return pipe(
		Either.sequenceArray([
			Uri.encode(clientKey),
			Uri.encode(fullRedirectUri),
			Uri.encode(state)
		]),
		Either.map(
			([encodedClientKey, encodedRedirectUri, encodedState]) =>
				`response_type=code&client_id=${encodedClientKey}&redirect_uri=${encodedRedirectUri}&state=${encodedState}`
		),
		Either.map((queryString) => `${baseUrl}?${queryString}`)
	);
};

const buildAuthCodeLoginUrl = (
	origin: string,
	state: number
): IOTryT<string> => {
	const envArray: ReadonlyArray<IOT<OptionT<string>>> = [
		Process.envLookupO('CLIENT_KEY'),
		Process.envLookupO('AUTH_CODE_REDIRECT_URI'),
		Process.envLookupO('AUTH_LOGIN_BASE_URI')
	];

	return pipe(
		IO.sequenceArray(envArray),
		IO.map(getRequiredValues),
		IOEither.chainEitherK((_) => createUrl(_, origin, state))
	);
};

export const prepareAuthCodeLogin = (req: Request): IOTryT<string> => {
	const state = randomInt(1_000_000_000);
	return pipe(
		getOrigin(req),
		IOEither.fromEither,
		IOEither.chainFirstIOK((origin) =>
			storeAuthCodeLoginSessionValues(req, state, origin)
		),
		IOEither.chain((origin) => buildAuthCodeLoginUrl(origin, state))
	);
};
