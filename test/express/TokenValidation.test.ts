import {
	accessToken,
	createAccessToken,
	createFullTestServer,
	FullTestServer,
	stopFullTestServer
} from '../testutils/fullTestServer';
import request from 'supertest';
import { createKeyPair } from '../testutils/keyPair';
import { pipe } from 'fp-ts/function';
import * as Try from '@craigmiller160/ts-functions/Try';
import { createTokenCookie } from '../../src/services/auth/Cookie';
import {
	AppRefreshToken,
	AppRefreshTokenModel,
	appRefreshTokenToModel
} from '../../src/mongo/models/AppRefreshTokenModel';
import { restClient } from '../../src/services/RestClient';
import MockAdapter from 'axios-mock-adapter';

const clearEnv = () => {
	delete process.env.COOKIE_NAME;
	delete process.env.COOKIE_MAX_AGE_SECS;
	delete process.env.COOKIE_PATH;
	delete process.env.CLIENT_NAME;
	delete process.env.CLIENT_KEY;
};

const refreshToken: AppRefreshToken = {
	tokenId: accessToken.jti,
	refreshToken: 'refreshToken'
};

const mockRestClient = new MockAdapter(restClient);

describe('TokenValidation', () => {
	let fullTestServer: FullTestServer;
	beforeAll(async () => {
		fullTestServer = await createFullTestServer();
	});

	afterAll(async () => {
		await stopFullTestServer(fullTestServer);
	});

	beforeEach(async () => {
		mockRestClient.reset();
		clearEnv();
		process.env.CLIENT_KEY = accessToken.clientKey;
		process.env.CLIENT_NAME = accessToken.clientName;
		await appRefreshTokenToModel(refreshToken).save();
	});

	afterEach(async () => {
		clearEnv();
		await AppRefreshTokenModel.deleteMany().exec();
	});

	it('has valid access token', async () => {
		const token = createAccessToken(fullTestServer.keyPair.privateKey);
		const res = await request(fullTestServer.expressServer.server)
			.get('/portfolios')
			.timeout(2000)
			.set('Authorization', `Bearer ${token}`)
			.expect(200);
		expect(res.body).toEqual([]);
	});

	it('has valid access token from cookie', async () => {
		process.env.COOKIE_NAME = 'cookieName';
		process.env.COOKIE_MAX_AGE_SECS = '8600';
		process.env.COOKIE_PATH = '/cookie-path';
		const token = createAccessToken(fullTestServer.keyPair.privateKey);
		const tokenCookie = pipe(createTokenCookie(token), Try.getOrThrow);
		const res = await request(fullTestServer.expressServer.server)
			.get('/portfolios')
			.timeout(2000)
			.set('Cookie', tokenCookie)
			.expect(200);
		expect(res.body).toEqual([]);
	});

	it('access token is expired and refresh is rejected', async () => {
		const token = createAccessToken(fullTestServer.keyPair.privateKey, {
			expiresIn: '-10m'
		});
		const res = await request(fullTestServer.expressServer.server)
			.get('/portfolios')
			.timeout(2000)
			.set('Authorization', `Bearer ${token}`)
			.expect(401);
		expect(res.body).toEqual(
			expect.objectContaining({
				status: 401,
				message: 'Unauthorized'
			})
		);
	});

	it('access token has invalid signature', async () => {
		const newKeyPair = pipe(createKeyPair(), Try.getOrThrow);
		const token = createAccessToken(newKeyPair.privateKey);
		const res = await request(fullTestServer.expressServer.server)
			.get('/portfolios')
			.timeout(2000)
			.set('Authorization', `Bearer ${token}`)
			.expect(401);
		expect(res.body).toEqual(
			expect.objectContaining({
				status: 401,
				message: 'Unauthorized'
			})
		);
	});

	it('has no access token', async () => {
		const res = await request(fullTestServer.expressServer.server)
			.get('/portfolios')
			.timeout(2000)
			.expect(401);
		expect(res.body).toEqual(
			expect.objectContaining({
				status: 401,
				message: 'Unauthorized'
			})
		);
	});

	it('has access token with invalid clientKey', async () => {
		process.env.CLIENT_KEY = 'abc';
		const accessToken = createAccessToken(
			fullTestServer.keyPair.privateKey
		);
		const res = await request(fullTestServer.expressServer.server)
			.get('/portfolios')
			.set('Authorization', `Bearer ${accessToken}`)
			.timeout(2000)
			.expect(401);
		expect(res.body).toEqual(
			expect.objectContaining({
				status: 401,
				message: 'Unauthorized'
			})
		);
	});

	it('has access token with invalid clientName', async () => {
		process.env.CLIENT_NAME = 'abc';
		const accessToken = createAccessToken(
			fullTestServer.keyPair.privateKey
		);
		const res = await request(fullTestServer.expressServer.server)
			.get('/portfolios')
			.set('Authorization', `Bearer ${accessToken}`)
			.timeout(2000)
			.expect(401);
		expect(res.body).toEqual(
			expect.objectContaining({
				status: 401,
				message: 'Unauthorized'
			})
		);
	});

	it('refreshes expired token', async () => {
		throw new Error();
	});

	it('no refresh token available', async () => {
		throw new Error();
	});
});
