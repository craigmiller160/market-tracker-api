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
import { TokenKey } from '../../src/auth/TokenKey';
import { AccessToken } from '../../src/express/TokenValidation';
import jwt, { SignOptions } from 'jsonwebtoken';
import { createSessionRoute } from './sessionRoute';

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

export const createFullTestServer = (): Promise<FullTestServer> =>
	pipe(
		createKeyPair(),
		TE.fromEither,
		TE.bindTo('keyPair'),
		TE.bind('mongoServer', createMongoTestServer),
		TE.bind('expressServer', ({ keyPair }) =>
			createExpressServerWithKey(keyPair.publicKey)
		),
		TE.map((fullTestServer) => {
			createSessionRoute(fullTestServer.expressServer.app);
			return fullTestServer;
		}),
		TaskTry.getOrThrow
	)();

export const stopFullTestServer = (
	fullTestServer: FullTestServer
): Promise<unknown> =>
	pipe(
		stopMongoTestServer(fullTestServer.mongoServer),
		TE.chain(() => stopExpressServer(fullTestServer.expressServer.server)),
		TaskTry.getOrThrow
	)();
