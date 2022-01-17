import { Request } from 'express';
import * as E from 'fp-ts/Either';
import * as O from 'fp-ts/Option';
import { pipe } from 'fp-ts/function';
import { randomInt } from 'crypto';
import * as A from 'fp-ts/Array';
import * as IO from 'fp-ts/IO';
import * as IOE from 'fp-ts/IOEither';
import * as Uri from '@craigmiller160/ts-functions/Uri';
import { getHeader, getMarketTrackerSession } from '../../function/HttpRequest';
import * as Time from '@craigmiller160/ts-functions/Time';
import { STATE_EXP_FORMAT } from './constants';
import { UnauthorizedError } from '../../error/UnauthorizedError';

export interface AuthCodeLoginResponse {
	readonly url: string;
}

const AUTH_CODE_LOGIN_PATH = '/ui/login';

const getOrigin = (req: Request): E.Either<Error, string> =>
	pipe(
		getHeader(req, 'Origin'),
		E.fromOption(
			() => new UnauthorizedError('Missing origin header on request')
		)
	);

const storeAuthCodeLoginSessionValues =
	(req: Request, state: number, origin: string): IO.IO<void> =>
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
): E.Either<Error, string> => {
	const [clientKey, authCodeRedirectUri, authLoginBaseUri] = envVariables;
	const baseUrl = `${origin}${authLoginBaseUri}${AUTH_CODE_LOGIN_PATH}`;
	const fullRedirectUri = `${origin}${authCodeRedirectUri}`;

	return pipe(
		E.sequenceArray([
			Uri.encode(clientKey),
			Uri.encode(fullRedirectUri),
			Uri.encode(state)
		]),
		E.map(
			([encodedClientKey, encodedRedirectUri, encodedState]) =>
				`response_type=code&client_id=${encodedClientKey}&redirect_uri=${encodedRedirectUri}&state=${encodedState}`
		),
		E.map((queryString) => `${baseUrl}?${queryString}`)
	);
};

const buildAuthCodeLoginUrl = (
	origin: string,
	state: number
): E.Either<Error, string> => {
	const nullableEnvArray: Array<string | undefined> = [
		process.env.CLIENT_KEY,
		process.env.AUTH_CODE_REDIRECT_URI,
		process.env.AUTH_LOGIN_BASE_URI
	];

	return pipe(
		nullableEnvArray,
		A.map(O.fromNullable),
		O.sequenceArray,
		E.fromOption(
			() =>
				new UnauthorizedError(
					`Missing environment variables for auth code login URL: ${nullableEnvArray}`
				)
		),
		E.chain((_) => createUrl(_, origin, state))
	);
};

export const prepareAuthCodeLogin = (req: Request): E.Either<Error, string> => {
	const state = randomInt(1_000_000_000);
	return pipe(
		getOrigin(req),
		E.chainFirst((_) =>
			IOE.fromIO<void, Error>(
				storeAuthCodeLoginSessionValues(req, state, _)
			)()
		),
		E.chain((origin) => buildAuthCodeLoginUrl(origin, state))
	);
};
