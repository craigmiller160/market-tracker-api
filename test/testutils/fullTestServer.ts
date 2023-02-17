import { ExpressServer, startExpressServer } from '../../src/express';
import {
	createMongoTestServer,
	MongoTestServer,
	stopMongoTestServer
} from './mongoServer';
import { pipe } from 'fp-ts/function';
import * as TE from 'fp-ts/TaskEither';
import * as TaskTry from '@craigmiller160/ts-functions/TaskTry';
import { createKeyPair, TokenKeyPair } from './keyPair';
import jwt, { SignOptions } from 'jsonwebtoken';
import { createSessionRoute } from './sessionRoute';
import {
	appRefreshTokenRepository,
	portfolioRepository,
	watchlistRepository
} from '../../src/data/repo';
import { KeycloakToken } from '../../src/keycloak/KeycloakToken';
import { nanoid } from 'nanoid';
import { Time } from '@craigmiller160/ts-functions';

export interface FullTestServer {
	readonly keyPair: TokenKeyPair;
	readonly expressServer: ExpressServer;
	readonly mongoServer: MongoTestServer;
}

export const accessToken: KeycloakToken = {
	jti: nanoid(),
	exp: Time.addDays(1)(new Date()).getTime() / 1000,
	iat: new Date().getTime() / 1000,
	realm_access: {
		roles: []
	},
	resource_access: {
		'market-tracker-api': {
			roles: ['access']
		}
	},
	email: 'craig@gmail.com',
	given_name: 'Craig',
	family_name: 'Miller',
	sub: nanoid(),
	aud: [],
	iss: 'issuer'
};

export const createAccessToken = (
	privateKey: string,
	options?: SignOptions
): string =>
	jwt.sign(accessToken, privateKey, {
		...(options ?? {}),
		algorithm: 'ES256',
		keyid: 'abc'
	});

const createExpressServerWithKey = (
	publicKey: string
): TE.TaskEither<Error, ExpressServer> =>
	startExpressServer({
		issuer: 'issuer',
		keys: {
			abc: publicKey
		}
	});

export const createFullTestServer = (): Promise<FullTestServer> => {
	return pipe(
		createKeyPair(),
		TE.fromEither,
		TE.bindTo('keyPair'),
		TE.bind('mongoServer', createMongoTestServer),
		TE.bind('expressServer', ({ keyPair }) =>
			createExpressServerWithKey(keyPair.publicKey)
		),
		TE.map((fullTestServer) => {
			createSessionRoute({
				expressApp: fullTestServer.expressServer.app,
				portfolioRepository,
				watchlistRepository,
				appRefreshTokenRepository
			});
			return fullTestServer;
		}),
		TaskTry.getOrThrow
	)();
};

export const stopFullTestServer = (
	fullTestServer: FullTestServer
): Promise<unknown> => {
	delete process.env.CLIENT_KEY;
	delete process.env.CLIENT_NAME;
	return pipe(
		stopMongoTestServer(fullTestServer.mongoServer),
		TaskTry.getOrThrow
	)();
};
