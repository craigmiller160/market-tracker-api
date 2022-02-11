import jwkToPem, { JWK } from 'jwk-to-pem';
import * as Either from 'fp-ts/Either';
import { pipe } from 'fp-ts/function';
import * as TaskEither from 'fp-ts/TaskEither';
import * as TaskTry from '@craigmiller160/ts-functions/TaskTry';
import { restClient } from '../RestClient';
import * as Try from '@craigmiller160/ts-functions/Try';
import { logAndReturn } from '../../logger';
import * as Process from '@craigmiller160/ts-functions/Process';

export interface TokenKey {
	readonly key: string;
}

const JWK_URI = '/jwk';

export interface JwkSet {
	readonly keys: JWK[];
}

const getJwkSetFromAuthServer = (
	authServerHost: string
): TaskEither.TaskEither<Error, JwkSet> =>
	pipe(
		TaskTry.tryCatch(() =>
			restClient.get<JwkSet>(`${authServerHost}${JWK_URI}`)
		),
		TaskEither.map((_) => _.data)
	);

const convertJwkToPem = (
	jwkSet: JwkSet
): TaskEither.TaskEither<Error, TokenKey> =>
	pipe(
		Try.tryCatch(() => jwkToPem(jwkSet.keys[0])),
		Either.map(
			(_): TokenKey => ({
				key: _
			})
		),
		TaskEither.fromEither
	);

export const loadTokenKey = (): TaskEither.TaskEither<Error, TokenKey> =>
	pipe(
		Process.envLookupE('AUTH_SERVER_HOST'),
		TaskEither.fromIOEither,
		TaskEither.map(logAndReturn('debug', 'Loading JWK')),
		TaskEither.chain(getJwkSetFromAuthServer),
		TaskEither.chain(convertJwkToPem),
		TaskEither.map(logAndReturn('info', 'JWK Loaded'))
	);
