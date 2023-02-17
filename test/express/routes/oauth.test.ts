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
import { AppRefreshTokenModel } from '../../../src/mongo/models/AppRefreshTokenModel';

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

describe('oauth routes', () => {
	let fullTestServer: FullTestServer;
	let validateSessionData: (
		sessionCookie: string,
		expectedSession: MarketTrackerSession
	) => Promise<void>;
	beforeAll(async () => {
		fullTestServer = await createFullTestServer();
		validateSessionData = createValidateSessionData(fullTestServer);
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
		beforeEach(() => {
			process.env.CLIENT_KEY = 'clientKey';
		});
		it('gets details for authenticated user', async () => {
			const token = createAccessToken(fullTestServer.keyPair.privateKey);
			const res = await request(fullTestServer.expressServer.server)
				.get('/oauth/user')
				.timeout(2000)
				.set('Authorization', `Bearer ${token}`)
				.expect(200);
			expect(res.body).toEqual(accessToken);
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
				.expect(500);
		});
	});
});
