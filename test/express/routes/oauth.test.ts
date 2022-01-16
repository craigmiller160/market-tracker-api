/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
	accessToken,
	createAccessToken,
	createFullTestServer,
	FullTestServer,
	stopFullTestServer
} from '../../testutils/fullTestServer';
import request from 'supertest';
import { restClient } from '../../../src/services/RestClient';
import MockAdapter from 'axios-mock-adapter';
import { MarketTrackerSession } from '../../../src/function/HttpRequest';
import { pipe } from 'fp-ts/function';
import { addMinutes, format } from '../../../src/function/DateFns';
import { STATE_EXP_FORMAT } from '../../../src/services/auth/constants';
import { TokenResponse } from '../../../src/types/TokenResponse';
import { AuthenticateBody } from '../../../src/services/auth/AuthCodeAuthentication';
import {
	AppRefreshToken,
	AppRefreshTokenModel,
	appRefreshTokenToModel
} from '../../../src/mongo/models/AppRefreshTokenModel';
import qs from 'qs';
import { AccessToken } from '../../../src/express/TokenValidation';

const clearEnv = () => {
	delete process.env.CLIENT_KEY;
	delete process.env.CLIENT_SECRET;
	delete process.env.AUTH_CODE_REDIRECT_URI;
	delete process.env.AUTH_LOGIN_BASE_URI;
	delete process.env.COOKIE_NAME;
	delete process.env.COOKIE_MAX_AGE_SECS;
	delete process.env.COOKIE_PATH;
	delete process.env.AUTH_SERVER_HOST;
	delete process.env.POST_AUTH_REDIRECT;
};

const setEnv = () => {
	process.env.CLIENT_KEY = 'clientKey';
	process.env.CLIENT_SECRET = 'clientSecret';
	process.env.AUTH_CODE_REDIRECT_URI = '/authCodeRedirectUri';
	process.env.AUTH_LOGIN_BASE_URI = '/authLoginBaseUri';
	process.env.COOKIE_NAME = 'my-cookie';
	process.env.COOKIE_MAX_AGE_SECS = '8600';
	process.env.COOKIE_PATH = '/the-path';
	process.env.AUTH_SERVER_HOST = 'https://localhost:7003';
	process.env.POST_AUTH_REDIRECT = '/postAuthRedirect';
};

const mockApi = new MockAdapter(restClient);
const EXPIRATION_REGEX = /\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3}/;

const getSessionCookie = (res: request.Response): string => {
	const cookieHeaders: string[] = res.headers['set-cookie'] ?? [];
	expect(cookieHeaders).toHaveLength(1);
	return cookieHeaders[0];
};

const createValidateSessionData =
	(fullTestServer: FullTestServer) =>
	async (
		sessionCookie: string,
		expectedSession: MarketTrackerSession = {}
	) => {
		const sessionRes = await request(fullTestServer.expressServer.server)
			.get('/session')
			.set('Cookie', sessionCookie)
			.timeout(2000)
			.expect(200);
		expect(sessionRes.body).toEqual(expectedSession);
	};

const createPrepareSession =
	(fullTestServer: FullTestServer) =>
	async (expectedSession?: MarketTrackerSession): Promise<string> => {
		const sessionPrepRes = await request(
			fullTestServer.expressServer.server
		)
			.post('/session')
			.timeout(2000)
			.set('Content-Type', 'application/json')
			.send(expectedSession)
			.expect(204);
		return getSessionCookie(sessionPrepRes);
	};

const mockTokenRequest = (code: string, responseStatus = 200) => {
	const body: AuthenticateBody = {
		grant_type: 'authorization_code',
		client_id: 'clientKey',
		code,
		redirect_uri: 'origin/authCodeRedirectUri'
	};

	const tokenResponse: TokenResponse = {
		accessToken: 'accessToken',
		refreshToken: 'refreshToken',
		tokenId: 'tokenId'
	};
	mockApi
		.onPost('https://localhost:7003/oauth/token', qs.stringify(body))
		.reply(responseStatus, tokenResponse);
};

const createStateExp = (mins: number): string =>
	pipe(new Date(), addMinutes(mins), format(STATE_EXP_FORMAT));

describe('oauth routes', () => {
	let fullTestServer: FullTestServer;
	let validateSessionData: (
		sessionCookie: string,
		expectedSession: MarketTrackerSession
	) => Promise<void>;
	let prepareSession: (
		expectedSession?: MarketTrackerSession
	) => Promise<string>;
	beforeAll(async () => {
		fullTestServer = await createFullTestServer();
		validateSessionData = createValidateSessionData(fullTestServer);
		prepareSession = createPrepareSession(fullTestServer);
	});

	afterAll(async () => {
		await stopFullTestServer(fullTestServer);
	});

	beforeEach(() => {
		clearEnv();
		mockApi.reset();
	});

	afterEach(async () => {
		clearEnv();
		await AppRefreshTokenModel.deleteMany().exec();
	});

	describe('get user details', () => {
		it('gets details for authenticated user', async () => {
			const token = createAccessToken(fullTestServer.keyPair.privateKey);
			const res = await request(fullTestServer.expressServer.server)
				.get('/oauth/user')
				.timeout(2000)
				.set('Authorization', `Bearer ${token}`)
				.expect(200);
			const expectedBody: Partial<AccessToken> = {
				...accessToken,
				jti: undefined
			};
			expect(res.body).toEqual(expectedBody);
		});

		it('fails when not authenticated', async () => {
			await request(fullTestServer.expressServer.server)
				.get('/oauth/user')
				.timeout(2000)
				.expect(401);
		});
	});

	describe('get auth code login url', () => {
		beforeEach(() => {
			setEnv();
		});

		it('successfully gets the url', async () => {
			const urlRegex =
				/^origin\/authLoginBaseUri\/ui\/login\?response_type=code&client_id=clientKey&redirect_uri=origin%2FauthCodeRedirectUri&state=(?<state>\d+)$/;
			const loginRes = await request(fullTestServer.expressServer.server)
				.post('/oauth/authcode/login')
				.set('Origin', 'origin')
				.timeout(2000)
				.expect(200);
			expect(loginRes.body).toEqual({
				url: expect.stringMatching(urlRegex)
			});

			const state = urlRegex.exec(loginRes.body.url)?.groups?.state;
			expect(state).not.toBeUndefined();

			const sessionCookie = getSessionCookie(loginRes);
			await validateSessionData(sessionCookie, {
				state: parseInt(state!),
				origin: 'origin',
				stateExpiration: expect.stringMatching(EXPIRATION_REGEX)
			});
		});

		it('missing origin header', async () => {
			await request(fullTestServer.expressServer.server)
				.post('/oauth/authcode/login')
				.timeout(2000)
				.expect(401);
		});

		it('missing environment variables for login', async () => {
			delete process.env.CLIENT_KEY;
			await request(fullTestServer.expressServer.server)
				.post('/oauth/authcode/login')
				.set('Origin', 'origin')
				.timeout(2000)
				.expect(401);
		});
	});

	describe('authenticate the auth code', () => {
		const code = 'ABCDEFG';
		const state = 12345;
		beforeEach(() => {
			setEnv();
		});

		it('successfully authenticates the auth code', async () => {
			mockTokenRequest(code);
			const sessionCookie = await prepareSession({
				origin: 'origin',
				state,
				stateExpiration: createStateExp(10)
			});

			const res = await request(fullTestServer.expressServer.server)
				.get(`/oauth/authcode/code?code=${code}&state=${state}`)
				.set('Cookie', sessionCookie)
				.timeout(2000)
				.expect(302);
			expect(res.headers['location']).toEqual('/postAuthRedirect');
			expect(res.headers['set-cookie']).toHaveLength(1);
			expect(res.headers['set-cookie'][0]).toEqual(
				'my-cookie=accessToken; Max-Age=8600; Secure; HttpOnly; SameSite=strict; Path=/the-path'
			);

			const results = await AppRefreshTokenModel.find().exec();
			expect(results).toHaveLength(1);
			expect(results[0]).toEqual(
				expect.objectContaining({
					tokenId: 'tokenId',
					refreshToken: 'refreshToken'
				})
			);
		});

		it('missing environment variables for authentication', async () => {
			delete process.env.CLIENT_KEY;
			mockTokenRequest(code);
			const sessionCookie = await prepareSession({
				origin: 'origin',
				state,
				stateExpiration: createStateExp(10)
			});

			await request(fullTestServer.expressServer.server)
				.get(`/oauth/authcode/code?code=${code}&state=${state}`)
				.set('Cookie', sessionCookie)
				.timeout(2000)
				.expect(401);

			const count = await AppRefreshTokenModel.count().exec();
			expect(count).toEqual(0);
		});

		it('missing environment variables for cookie creation', async () => {
			delete process.env.COOKIE_NAME;
			mockTokenRequest(code);
			const sessionCookie = await prepareSession({
				origin: 'origin',
				state,
				stateExpiration: createStateExp(10)
			});

			await request(fullTestServer.expressServer.server)
				.get(`/oauth/authcode/code?code=${code}&state=${state}`)
				.set('Cookie', sessionCookie)
				.timeout(2000)
				.expect(401);

			const count = await AppRefreshTokenModel.count().exec();
			expect(count).toEqual(1);
		});

		it('invalid state for authentication', async () => {
			mockTokenRequest(code);
			const sessionCookie = await prepareSession({
				origin: 'origin',
				state: 8765,
				stateExpiration: createStateExp(10)
			});

			await request(fullTestServer.expressServer.server)
				.get(`/oauth/authcode/code?code=${code}&state=${state}`)
				.set('Cookie', sessionCookie)
				.timeout(2000)
				.expect(401);

			const count = await AppRefreshTokenModel.count().exec();
			expect(count).toEqual(0);
		});

		it('expired state for authentication', async () => {
			mockTokenRequest(code);
			const sessionCookie = await prepareSession({
				origin: 'origin',
				state,
				stateExpiration: createStateExp(-10)
			});

			await request(fullTestServer.expressServer.server)
				.get(`/oauth/authcode/code?code=${code}&state=${state}`)
				.set('Cookie', sessionCookie)
				.timeout(2000)
				.expect(401);

			const count = await AppRefreshTokenModel.count().exec();
			expect(count).toEqual(0);
		});

		it('authentication rejected by auth server', async () => {
			mockTokenRequest(code, 401);
			const sessionCookie = await prepareSession({
				origin: 'origin',
				state,
				stateExpiration: createStateExp(10)
			});

			await request(fullTestServer.expressServer.server)
				.get(`/oauth/authcode/code?code=${code}&state=${state}`)
				.set('Cookie', sessionCookie)
				.timeout(2000)
				.expect(401);

			const count = await AppRefreshTokenModel.count().exec();
			expect(count).toEqual(0);
		});
	});

	describe('logout', () => {
		beforeEach(() => {
			setEnv();
		});

		it('logs out', async () => {
			const refreshToken: AppRefreshToken = {
				tokenId: accessToken.jti,
				refreshToken: 'refreshToken'
			};
			await appRefreshTokenToModel(refreshToken).save();

			const token = createAccessToken(fullTestServer.keyPair.privateKey);
			const sessionCookie = await prepareSession();
			const res = await request(fullTestServer.expressServer.server)
				.get('/oauth/logout')
				.timeout(2000)
				.set('Cookie', sessionCookie)
				.set('Authorization', `Bearer ${token}`)
				.expect(204);
			expect(res.headers['set-cookie']).toHaveLength(1);
			expect(res.headers['set-cookie'][0]).toEqual(
				'my-cookie=; Max-Age=0; Secure; HttpOnly; SameSite=strict; Path=/the-path'
			);

			const count = await AppRefreshTokenModel.count();
			expect(count).toEqual(0);
		});

		it('missing environment variables for logout', async () => {
			delete process.env.COOKIE_NAME;
			await request(fullTestServer.expressServer.server)
				.get('/oauth/logout')
				.timeout(2000)
				.expect(401);
		});
	});
});
