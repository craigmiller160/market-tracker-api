import {
	createAccessToken,
	createFullTestServer,
	FullTestServer,
	stopFullTestServer
} from '../testutils/fullTestServer';
import request from 'supertest';
import { createKeyPair } from '../testutils/keyPair';
import { pipe } from 'fp-ts/function';
import * as EU from '../../src/function/EitherUtils';
import { createTokenCookie } from '../../src/services/auth/Cookie';

const clearEnv = () => {
	delete process.env.COOKIE_NAME;
	delete process.env.COOKIE_MAX_AGE_SECS;
	delete process.env.COOKIE_PATH;
};

describe('TokenValidation', () => {
	let fullTestServer: FullTestServer;
	beforeAll(async () => {
		fullTestServer = await createFullTestServer();
	});

	afterAll(async () => {
		await stopFullTestServer(fullTestServer);
	});

	beforeEach(() => {
		clearEnv();
	});

	afterEach(() => {
		clearEnv();
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
		const tokenCookie = pipe(createTokenCookie(token), EU.throwIfLeft);
		const res = await request(fullTestServer.expressServer.server)
			.get('/portfolios')
			.timeout(2000)
			.set('Cookie', tokenCookie)
			.expect(200);
		expect(res.body).toEqual([]);
	});

	it('access token is expired', async () => {
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
		const newKeyPair = pipe(createKeyPair(), EU.throwIfLeft);
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
});
