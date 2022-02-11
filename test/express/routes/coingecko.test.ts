import MockAdapter from 'axios-mock-adapter';
import { restClient } from '../../../src/services/RestClient';
import {
	createAccessToken,
	createFullTestServer,
	FullTestServer,
	stopFullTestServer
} from '../../testutils/fullTestServer';
import request from 'supertest';

export {};

const baseUrl = 'https://coingecko.com';

const clearEnv = () => {
	delete process.env.COIN_GECKO_BASE_URL;
};

const setEnv = () => {
	process.env.COIN_GECKO_BASE_URL = baseUrl;
};

const mockClient = new MockAdapter(restClient);
const cgResponse = {
	hello: 'world'
};
const cgError = {
	hello: 'fail'
};

describe('coingecko route', () => {
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

	describe('queryCoinGecko', () => {
		it('fails auth when making CoinGecko request', async () => {
			await request(fullTestServer.expressServer.server)
				.get('/coingecko/foo?abc=def')
				.timeout(2000)
				.expect(401);
			expect(mockClient.history.get).toHaveLength(0);
		});

		it('forwards requests to CoinGecko', async () => {
			mockClient.onGet(`${baseUrl}/foo?abc=def`).reply(200, cgResponse);
			const token = createAccessToken(fullTestServer.keyPair.privateKey);
			const res = await request(fullTestServer.expressServer.server)
				.get('/coingecko/foo?abc=def')
				.set('Authorization', `Bearer ${token}`)
				.timeout(2000)
				.expect(200);
			expect(res.body).toEqual(cgResponse);
		});

		it('handles CoinGecko request errors', async () => {
			mockClient.onGet(`${baseUrl}/foo?abc=def`).reply(500, cgError);
			const token = createAccessToken(fullTestServer.keyPair.privateKey);
			const res = await request(fullTestServer.expressServer.server)
				.get('/coingecko/foo?abc=def')
				.set('Authorization', `Bearer ${token}`)
				.timeout(2000)
				.expect(500);
			expect(res.body).toEqual(
				expect.objectContaining({
					message: `Error calling CoinGecko. Status: 500 Message: ${JSON.stringify(
						cgError
					)}`
				})
			);
		});
	});

	describe('getCoinGeckoMarketChart', () => {
		it('fails auth when making market chart request', async () => {
			throw new Error();
		});

		it('gets and filters market chart data', async () => {
			throw new Error();
		});

		it('handles market chart request errors', async () => {
			throw new Error();
		});
	});
});
