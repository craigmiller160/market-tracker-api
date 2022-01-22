import * as Option from 'fp-ts/Option';
import * as Either from 'fp-ts/Either';
import * as Try from '@craigmiller160/ts-functions/Try';
import * as TaskTry from '@craigmiller160/ts-functions/TaskTry';
import * as TaskEither from 'fp-ts/TaskEither';
import { pipe } from 'fp-ts/function';
import { UnauthorizedError } from '../../error/UnauthorizedError';
import qs from 'qs';
import { TokenResponse } from '../../types/TokenResponse';
import { restClient } from '../RestClient';
import { logError } from '../../logger';
import * as IO from 'fp-ts/IO';
import { getRequiredValues } from '../../function/Values';

const TOKEN_PATH = '/oauth/token';

const getBasicAuth = (): Try.Try<string> => {
	const envArray: ReadonlyArray<string | undefined> = [
		process.env.CLIENT_KEY,
		process.env.CLIENT_SECRET
	];

	return pipe(
		getRequiredValues(envArray),
		Either.chain(([clientKey, clientSecret]) =>
			Try.tryCatch(() =>
				Buffer.from(`${clientKey}:${clientSecret}`).toString('base64')
			)
		)
	);
};

const getAuthServerHost = (): Try.Try<string> =>
	pipe(
		Option.fromNullable(process.env.AUTH_SERVER_HOST),
		Either.fromOption(
			() => new UnauthorizedError('Missing authorization server host')
		)
	);

const handleRestCallError = (error: Error): IO.IO<Error> =>
	pipe(
		logError('Auth server returned error response', error),
		IO.map(
			() => new UnauthorizedError('Error authenticating with AuthServer')
		)
	);

const executeTokenRestCall = (
	authServerHost: string,
	body: string,
	basicAuth: string
): TaskTry.TaskTry<TokenResponse> =>
	pipe(
		TaskTry.tryCatch(() =>
			restClient.post<TokenResponse>(
				`${authServerHost}${TOKEN_PATH}`,
				body,
				{
					headers: {
						'content-type': 'application/x-www-form-urlencoded',
						authorization: `Basic ${basicAuth}`
					}
				}
			)
		),
		TaskEither.map((_) => _.data),
		TaskEither.mapLeft((_) => handleRestCallError(_)())
	);

export const sendTokenRequest = (
	requestBody: object
): TaskTry.TaskTry<TokenResponse> => {
	const formattedRequestBody = qs.stringify(requestBody);
	return pipe(
		getAuthServerHost(),
		Either.bindTo('authServerHost'),
		Either.bind('basicAuth', getBasicAuth),
		TaskEither.fromEither,
		TaskEither.chain(({ basicAuth, authServerHost }) =>
			executeTokenRestCall(
				authServerHost,
				formattedRequestBody,
				basicAuth
			)
		)
	);
};
