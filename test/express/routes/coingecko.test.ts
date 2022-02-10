import MockAdapter from 'axios-mock-adapter';
import { restClient } from '../../../src/services/RestClient';
import {
	createFullTestServer,
	FullTestServer,
	stopFullTestServer
} from '../../testutils/fullTestServer';

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

	it('fails auth when making CoinGecko request', async () => {
		throw new Error();
	});

	it('forwards requests to CoinGecko', async () => {
		throw new Error();
	});

	it('handles CoinGecko request errors', async () => {
		throw new Error();
	});
});
