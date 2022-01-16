import { pipe } from 'fp-ts/function';
import * as E from 'fp-ts/Either';
import * as O from 'fp-ts/Option';
import * as A from 'fp-ts/Array';
import { UnauthorizedError } from '../../error/UnauthorizedError';

const createCookie = (
	cookieName: string,
	value: string,
	maxAgeSecs: string,
	cookiePath: string
): string =>
	`${cookieName}=${value}; Max-Age=${maxAgeSecs}; Secure; HttpOnly; SameSite=strict; Path=${cookiePath}`;

export const getEmptyCookie = (): E.Either<Error, string> =>
	pipe(
		getCookieEnv(),
		E.map(([cookieName, , cookiePath]) =>
			createCookie(cookieName, '', '0', cookiePath)
		)
	);

const getCookieEnv = (): E.Either<Error, readonly string[]> => {
	const nullableEnvArray: Array<string | undefined> = [
		process.env.COOKIE_NAME,
		process.env.COOKIE_MAX_AGE_SECS,
		process.env.COOKIE_PATH
	];

	return pipe(
		nullableEnvArray,
		A.map(O.fromNullable),
		O.sequenceArray,
		E.fromOption(
			() =>
				new UnauthorizedError(
					`Missing environment variables for setting cookie: ${nullableEnvArray}`
				)
		)
	);
};

export const createTokenCookie = (
	accessToken: string
): E.Either<Error, string> =>
	pipe(
		getCookieEnv(),
		E.map(([cookieName, cookieMaxAgeSecs, cookiePath]) =>
			createCookie(cookieName, accessToken, cookieMaxAgeSecs, cookiePath)
		)
	);
