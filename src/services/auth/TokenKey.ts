import jwkToPem, { JWK } from 'jwk-to-pem';
import * as E from 'fp-ts/Either';
import { pipe } from 'fp-ts/function';
import * as O from 'fp-ts/Option';
import * as TaskEither from 'fp-ts/TaskEither';
import * as TaskTry from '@craigmiller160/ts-functions/TaskTry';
import { restClient } from '../RestClient';
import * as Try from '@craigmiller160/ts-functions/Try';
import { logAndReturn } from '../../logger';

export interface TokenKey {
	readonly key: string;
}

const JWK_URI = '/jwk';

export interface JwkSet {
	readonly keys: JWK[];
}

const getAuthServerHost = (): E.Either<Error, string> =>
	pipe(
		O.fromNullable(process.env.AUTH_SERVER_HOST),
		E.fromOption(
			() => new Error('Auth Server Host variable is not available')
		)
	);

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
		E.map(
			(_): TokenKey => ({
				key: _
			})
		),
		TaskEither.fromEither
	);

export const loadTokenKey = (): TaskEither.TaskEither<Error, TokenKey> =>
	pipe(
		getAuthServerHost(),
		TaskEither.fromEither,
		TaskEither.map(logAndReturn('debug', 'Loading JWK')),
		TaskEither.chain(getJwkSetFromAuthServer),
		TaskEither.chain(convertJwkToPem),
		TaskEither.map(logAndReturn('info', 'JWK Loaded'))
	);
