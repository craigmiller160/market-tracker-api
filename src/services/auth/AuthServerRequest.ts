import * as TaskTry from '@craigmiller160/ts-functions/TaskTry';
import * as TaskEither from 'fp-ts/TaskEither';
import { pipe } from 'fp-ts/function';
import { UnauthorizedError } from '../../error/UnauthorizedError';
import qs from 'qs';
import { TokenResponse } from '../../types/TokenResponse';
import { restClient } from '../RestClient';
import { logger } from '../../logger';
import { getRequiredValues } from '../../function/Values';
import {
	IOT,
	IOTryT,
	OptionT,
	TaskTryT
} from '@craigmiller160/ts-functions/types';
import * as Process from '@craigmiller160/ts-functions/Process';
import * as IO from 'fp-ts/IO';
import * as IOEither from 'fp-ts/IOEither';
import * as IOTry from '@craigmiller160/ts-functions/IOTry';

const TOKEN_PATH = '/oauth/token';

const getBasicAuth = (): IOTryT<string> => {
	const envArray: ReadonlyArray<IOT<OptionT<string>>> = [
		Process.envLookupO('CLIENT_KEY'),
		Process.envLookupO('CLIENT_SECRET')
	];

	return pipe(
		IO.sequenceArray(envArray),
		IO.map(getRequiredValues),
		IOEither.chain(([clientKey, clientSecret]) =>
			IOTry.tryCatch(() =>
				Buffer.from(`${clientKey}:${clientSecret}`).toString('base64')
			)
		)
	);
};

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
		TaskEither.mapLeft((ex) =>
			pipe(
				logger.errorWithStack(
					'Auth server returned error response',
					ex
				),
				IO.map(
					() =>
						new UnauthorizedError(
							'Error uathenticating with AuthServer'
						)
				)
			)()
		)
	);

export const sendTokenRequest = (
	requestBody: object
): TaskTryT<TokenResponse> => {
	const formattedRequestBody = qs.stringify(requestBody);
	return pipe(
		Process.envLookupE('AUTH_SERVER_HOST'),
		IOEither.bindTo('authServerHost'),
		IOEither.bind('basicAuth', getBasicAuth),
		TaskEither.fromIOEither,
		TaskEither.chain(({ basicAuth, authServerHost }) =>
			executeTokenRestCall(
				authServerHost,
				formattedRequestBody,
				basicAuth
			)
		)
	);
};
