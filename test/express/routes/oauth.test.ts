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
import { AppRefreshTokenModel } from '../../../src/mongo/models/AppRefreshTokenModel';

const mockApi = new MockAdapter(restClient);

describe('oauth routes', () => {
	let fullTestServer: FullTestServer;
	beforeAll(async () => {
		fullTestServer = await createFullTestServer();
	});

	afterAll(async () => {
		await stopFullTestServer(fullTestServer);
	});

	beforeEach(() => {
		mockApi.reset();
	});

	afterEach(async () => {
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
});
