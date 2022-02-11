import { pipe } from 'fp-ts/function';
import { IOT, IOTryT, OptionT } from '@craigmiller160/ts-functions/types';
import * as Process from '@craigmiller160/ts-functions/Process';
import * as IO from 'fp-ts/IO';
import { getRequiredValues } from '../../function/Values';
import * as IOEither from 'fp-ts/IOEither';

const createCookie = (
	cookieName: string,
	value: string,
	maxAgeSecs: string,
	cookiePath: string
): string =>
	`${cookieName}=${value}; Max-Age=${maxAgeSecs}; Secure; HttpOnly; SameSite=strict; Path=${cookiePath}`;

export const getEmptyCookie = (): IOTryT<string> =>
	pipe(
		getCookieEnv(),
		IOEither.map(([cookieName, , cookiePath]) =>
			createCookie(cookieName, '', '0', cookiePath)
		)
	);

const getCookieEnv = (): IOTryT<ReadonlyArray<string>> => {
	const envArray: ReadonlyArray<IOT<OptionT<string>>> = [
		Process.envLookupO('COOKIE_NAME'),
		Process.envLookupO('COOKIE_MAX_AGE_SECS'),
		Process.envLookupO('COOKIE_PATH')
	];

	return pipe(IO.sequenceArray(envArray), IO.map(getRequiredValues));
};

export const createTokenCookie = (accessToken: string): IOTryT<string> =>
	pipe(
		getCookieEnv(),
		IOEither.map(([cookieName, cookieMaxAgeSecs, cookiePath]) =>
			createCookie(cookieName, accessToken, cookieMaxAgeSecs, cookiePath)
		)
	);
