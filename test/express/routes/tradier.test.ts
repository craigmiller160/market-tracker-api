import {
	FullTestServer,
	createFullTestServer,
	stopFullTestServer
} from '../../testutils/fullTestServer';

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

describe('tradier', () => {
	let fullTestServer: FullTestServer;
	beforeAll(async () => {
		fullTestServer = await createFullTestServer();
	});

	afterAll(async () => {
		await stopFullTestServer(fullTestServer);
	});

	beforeEach(() => {
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
