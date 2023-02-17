import jwkToPem, { JWK } from 'jwk-to-pem';
import * as TaskEither from 'fp-ts/TaskEither';
import { restClient } from '../services/RestClient';
import { TaskTry } from '@craigmiller160/ts-functions';
import { pipe } from 'fp-ts/function';
import { TaskTryT } from '@craigmiller160/ts-functions/types';
import { logger } from '../logger';

export type JWKWithID = JWK & {
	readonly kid: string;
};

export type JwkSet = {
	readonly keys: JWKWithID[];
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

const jwtSetToKeys = (jwtSet: JwkSet): Record<string, string> =>
	jwtSet.keys
		.map((jwk) => {
			const pem = jwkToPem(jwk);
			return {
				[jwk.kid]: pem
			};
		})
		.reduce((acc, rec) => {
			return {
				...acc,
				...rec
			};
		}, {});

const getKeys = (jwksUrl: string): TaskTryT<Record<string, string>> =>
	pipe(getJwkSet(jwksUrl), TaskEither.map(jwtSetToKeys));

export const getTokenValidationConfig = (
	keycloakHost: string,
	realm: string
): TaskTryT<TokenValidationConfig> => {
	logger.debug('Downloading Keycloak configuration & keys')();
	return pipe(
		getOpenidConfiguration(keycloakHost, realm),
		TaskEither.bindTo('openidConfig'),
		TaskEither.bind('keys', ({ openidConfig }) =>
			getKeys(openidConfig.jwks_uri)
		),
		TaskEither.map(
			({ openidConfig, keys }): TokenValidationConfig => ({
				issuer: openidConfig.issuer,
				keys
			})
		)
	);
};
