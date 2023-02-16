import jwkToPem, { JWK } from 'jwk-to-pem';
import * as TaskEither from 'fp-ts/TaskEither';
import { restClient } from '../services/RestClient';
import { TaskTry } from '@craigmiller160/ts-functions';
import { pipe } from 'fp-ts/function';
import { logger } from '../logger';
import { TaskTryT } from '@craigmiller160/ts-functions/types';

export type JwkSet = {
	readonly keys: JWK[];
};

export type TokenValidationConfig = {
	readonly issuer: string;
	readonly keys: Record<string, string>;
};

type OpenidConfiguration = {
	readonly issuer: string;
	readonly jwks_uri: string;
};

const getJwkSet = (url: string): TaskTryT<JwkSet> =>
	TaskTry.tryCatch(() => restClient.get<JwkSet>(url).then((res) => res.data));

const getOpenidConfiguration = (
	keycloakHost: string,
	realm: string
): TaskTryT<OpenidConfiguration> =>
	TaskTry.tryCatch(() =>
		restClient
			.get<OpenidConfiguration>(
				`${keycloakHost}/realms/${realm}/.well-known/openid-configuration`
			)
			.then((res) => res.data)
	);

const getTokenValidationConfig = (
	keycloakHost: string,
	realm: string
): TaskTryT<TokenValidationConfig> => {
	pipe(
		getOpenidConfiguration(keycloakHost, realm),
		TaskEither.bindTo('openidConfig'),
		TaskEither.bind('jwkSet', ({ openidConfig }) =>
			getJwkSet(openidConfig.jwks_uri)
		)
	);
};
