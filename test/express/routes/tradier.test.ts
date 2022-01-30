import {
	FullTestServer,
	createFullTestServer,
	stopFullTestServer,
	createAccessToken
} from '../../testutils/fullTestServer';
import { restClient } from '../../../src/services/RestClient';
import MockAdapter from 'axios-mock-adapter';
import request from 'supertest';

const baseUrl = 'https://tradier.com';
const apiKey = 'apiKey';

const clearEnv = () => {
	delete process.env.TRADIER_BASE_URL;
	delete process.env.TRADIER_API_KEY;
};

const setEnv = () => {
	process.env.TRADIER_BASE_URL = baseUrl;
	process.env.TRADIER_API_KEY = apiKey;
};

const mockClient = new MockAdapter(restClient);
const tradierResponse = {
	hello: 'world'
};
const tradierError = {
	hello: 'fail'
};

describe('tradier', () => {
	let fullTestServer: FullTestServer;
	beforeAll(async () => {
		fullTestServer = await createFullTestServer();
	});

	afterAll(async () => {
		await stopFullTestServer(fullTestServer);
	});

	beforeEach(() => {
		mockClient.reset();
		setEnv();
	});

	afterEach(() => {
		clearEnv();
	});

	it('fails auth when making Tradier request', async () => {
		await request(fullTestServer.expressServer.server)
			.get('/tradier/foo?abc=def')
			.timeout(2000)
			.expect(401);
		expect(mockClient.history.get).toHaveLength(0);
	});

	it('forwards requests to Tradier', async () => {
		mockClient.onGet(`${baseUrl}/foo?abc=def`).reply((config) => {
			expect(config.headers).toEqual(
				expect.objectContaining({
					Accept: 'application/json',
					Authorization: `Bearer ${apiKey}`
				})
			);
			return [200, tradierResponse];
		});
		const token = createAccessToken(fullTestServer.keyPair.privateKey);
		const res = await request(fullTestServer.expressServer.server)
			.get('/tradier/foo?abc=def')
			.set('Authorization', `Bearer ${token}`)
			.timeout(2000)
			.expect(200);
		expect(res.body).toEqual(tradierResponse);
	});

	it('handles Tradier request errors', async () => {
		mockClient.onGet(`${baseUrl}/foo?abc=def`).reply((config) => {
			expect(config.headers).toEqual(
				expect.objectContaining({
					Accept: 'application/json',
					Authorization: `Bearer ${apiKey}`
				})
			);
			return [500, tradierError];
		});
		const token = createAccessToken(fullTestServer.keyPair.privateKey);
		const res = await request(fullTestServer.expressServer.server)
			.get('/tradier/foo?abc=def')
			.set('Authorization', `Bearer ${token}`)
			.timeout(2000)
			.expect(500);
		console.log(res.body);
		// TODO validate response message
	});
});
