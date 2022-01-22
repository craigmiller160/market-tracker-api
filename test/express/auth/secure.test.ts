import {
	accessToken,
	createAccessToken,
	createFullTestServer,
	FullTestServer,
	stopFullTestServer
} from '../../testutils/fullTestServer';
import request from 'supertest';
import { createKeyPair } from '../../testutils/keyPair';
import { pipe } from 'fp-ts/function';
import * as Try from '@craigmiller160/ts-functions/Try';
import { createTokenCookie } from '../../../src/services/auth/Cookie';
import {
	AppRefreshToken,
	AppRefreshTokenModel,
	appRefreshTokenToModel
} from '../../../src/mongo/models/AppRefreshTokenModel';
import { restClient } from '../../../src/services/RestClient';
import MockAdapter from 'axios-mock-adapter';
import { TokenResponse } from '../../../src/types/TokenResponse';

const clearEnv = () => {
	delete process.env.COOKIE_NAME;
	delete process.env.COOKIE_MAX_AGE_SECS;
	delete process.env.COOKIE_PATH;
	delete process.env.CLIENT_NAME;
	delete process.env.CLIENT_KEY;
};

const createTokenResponse = (
	accessToken: string,
	tokenId = 'tokenId2'
): TokenResponse => ({
	accessToken,
	refreshToken: 'refreshToken2',
	tokenId
});

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
		process.env.AUTH_SERVER_HOST = 'http://auth-server';
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

	it('access token is expired and refresh is skipped because token comes from header', async () => {
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

	it('token is expired, refresh returns expired token, prevent infinite loop', async () => {
		process.env.CLIENT_KEY = accessToken.clientKey;
		process.env.CLIENT_SECRET = 'clientSecret';
		process.env.COOKIE_NAME = 'cookieName';
		process.env.COOKIE_MAX_AGE_SECS = '8600';
		process.env.COOKIE_PATH = '/cookie-path';
		const newToken = createAccessToken(fullTestServer.keyPair.privateKey, {
			expiresIn: '-10m'
		});
		const tokenResponse = createTokenResponse(newToken, accessToken.jti);
		mockRestClient
			.onPost(
				'http://auth-server/oauth/token',
				`grant_type=refresh_token&refresh_token=${refreshToken.refreshToken}`
			)
			.reply(200, tokenResponse);
		mockRestClient
			.onPost(
				'http://auth-server/oauth/token',
				`grant_type=refresh_token&refresh_token=${tokenResponse.refreshToken}`
			)
			.reply(200, tokenResponse);
		const token = createAccessToken(fullTestServer.keyPair.privateKey, {
			expiresIn: '-10m'
		});
		const tokenCookie = Try.getOrThrow(createTokenCookie(token));
		await request(fullTestServer.expressServer.server)
			.get('/portfolios')
			.timeout(2000)
			.set('Cookie', tokenCookie)
			.expect(401);
		expect(mockRestClient.history.post).toHaveLength(1);

		const refreshTokens = await AppRefreshTokenModel.find().exec();
		expect(refreshTokens).toHaveLength(1);
		expect(refreshTokens[0]).toEqual(
			expect.objectContaining({
				tokenId: tokenResponse.tokenId,
				refreshToken: tokenResponse.refreshToken
			})
		);
	});

	it('token is expired, but it refreshes expired token', async () => {
		process.env.CLIENT_KEY = accessToken.clientKey;
		process.env.CLIENT_SECRET = 'clientSecret';
		process.env.COOKIE_NAME = 'cookieName';
		process.env.COOKIE_MAX_AGE_SECS = '8600';
		process.env.COOKIE_PATH = '/cookie-path';
		const newToken = createAccessToken(fullTestServer.keyPair.privateKey);
		const tokenResponse = createTokenResponse(newToken);
		mockRestClient
			.onPost(
				'http://auth-server/oauth/token',
				`grant_type=refresh_token&refresh_token=${refreshToken.refreshToken}`
			)
			.reply(200, tokenResponse);
		const token = createAccessToken(fullTestServer.keyPair.privateKey, {
			expiresIn: '-10m'
		});
		const tokenCookie = Try.getOrThrow(createTokenCookie(token));
		const res = await request(fullTestServer.expressServer.server)
			.get('/portfolios')
			.timeout(2000)
			.set('Cookie', tokenCookie)
			.expect(200);
		expect(res.body).toEqual([]);
		expect(mockRestClient.history.post).toHaveLength(1);

		const refreshTokensInDb = await AppRefreshTokenModel.find().exec();
		expect(refreshTokensInDb).toHaveLength(1);
		expect(refreshTokensInDb[0]).toEqual(
			expect.objectContaining({
				tokenId: tokenResponse.tokenId,
				refreshToken: tokenResponse.refreshToken
			})
		);

		const newTokenCookie = Try.getOrThrow(createTokenCookie(newToken));
		const returnedTokenCookie = (
			res.headers['set-cookie'] as string[]
		).find((cookie) => cookie.startsWith('cookieName'));
		expect(returnedTokenCookie).toEqual(newTokenCookie);
	});

	it('token is expired, and no refresh token available', async () => {
		process.env.CLIENT_KEY = accessToken.clientKey;
		process.env.CLIENT_SECRET = 'clientSecret';
		process.env.COOKIE_NAME = 'cookieName';
		process.env.COOKIE_MAX_AGE_SECS = '8600';
		process.env.COOKIE_PATH = '/cookie-path';
		process.env.CLIENT_KEY = accessToken.clientKey;
		process.env.CLIENT_SECRET = 'clientSecret';
		process.env.COOKIE_NAME = 'cookieName';
		process.env.COOKIE_MAX_AGE_SECS = '8600';
		process.env.COOKIE_PATH = '/cookie-path';
		await AppRefreshTokenModel.deleteMany().exec();
		const token = createAccessToken(fullTestServer.keyPair.privateKey, {
			expiresIn: '-10m'
		});
		const tokenCookie = Try.getOrThrow(createTokenCookie(token));
		await request(fullTestServer.expressServer.server)
			.get('/portfolios')
			.timeout(2000)
			.set('Cookie', tokenCookie)
			.expect(401);
		expect(mockRestClient.history.post).toHaveLength(0);
	});

	it('token is expired, and refresh request is rejected', async () => {
		process.env.CLIENT_KEY = accessToken.clientKey;
		process.env.CLIENT_SECRET = 'clientSecret';
		process.env.COOKIE_NAME = 'cookieName';
		process.env.COOKIE_MAX_AGE_SECS = '8600';
		process.env.COOKIE_PATH = '/cookie-path';
		throw new Error();
	});
});
