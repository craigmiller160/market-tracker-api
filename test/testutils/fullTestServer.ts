import { ExpressServer, startExpressServer } from '../../src/express';
import {
	createMongoTestServer,
	MongoTestServer,
	stopMongoTestServer
} from './mongoServer';
import { pipe } from 'fp-ts/function';
import * as TE from 'fp-ts/TaskEither';
import * as TaskTry from '@craigmiller160/ts-functions/TaskTry';
import { stopExpressServer } from './expressServer';
import { createKeyPair, TokenKeyPair } from './keyPair';
import { TokenKey } from '../../src/services/auth/TokenKey';
import { AccessToken } from '../../src/express/auth/AccessToken';
import jwt, { SignOptions } from 'jsonwebtoken';
import { createSessionRoute } from './sessionRoute';
import {
	appRefreshTokenRepository,
	portfolioRepository,
	watchlistRepository
} from '../../src/data/repo';

export interface FullTestServer {
	readonly keyPair: TokenKeyPair;
	readonly expressServer: ExpressServer;
	readonly mongoServer: MongoTestServer;
}

export const accessToken: AccessToken = {
	userId: 1,
	userEmail: 'bob@gmail.com',
	firstName: 'Bob',
	lastName: 'Saget',
	roles: [],
	sub: 'bob@gmail.com',
	clientKey: 'clientKey',
	clientName: 'the-app',
	jti: 'tokenId'
};

export const createAccessToken = (
	privateKey: string,
	options?: SignOptions
): string =>
	jwt.sign(accessToken, privateKey, {
		...(options ?? {}),
		algorithm: 'ES256'
	});

const createExpressServerWithKey = (
	publicKey: string
): TE.TaskEither<Error, ExpressServer> => {
	const tokenKey: TokenKey = {
		key: publicKey
	};
	return startExpressServer(tokenKey);
};

export const createFullTestServer = (): Promise<FullTestServer> => {
	process.env.CLIENT_KEY = accessToken.clientKey;
	process.env.CLIENT_NAME = accessToken.clientName;
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
				appRefreshTokenRepository,
				tokenKey: {
					key: ''
				}
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
		TE.chain(() => stopExpressServer(fullTestServer.expressServer.server)),
		TaskTry.getOrThrow
	)();
};
