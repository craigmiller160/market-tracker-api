import {
	FullTestServer,
	createFullTestServer,
	stopFullTestServer
} from '../../testutils/fullTestServer';
import { restClient } from '../../../src/services/RestClient';
import MockAdapter from 'axios-mock-adapter';

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

	it('forwards requests to Tradier', async () => {
		throw new Error();
	});

	it('handles Tradier request errors', async () => {
		throw new Error();
	});
});
