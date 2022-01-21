import { restClient } from '../../../src/services/RestClient';
import MockAdapter from 'axios-mock-adapter';
import '@relmify/jest-fp-ts';
import jwkToPem from 'jwk-to-pem';
import { JwkSet, loadTokenKey } from '../../../src/services/auth/TokenKey';

const mockRestClient = new MockAdapter(restClient);

jest.mock('jwk-to-pem', () => {
	const { JWK } = jest.requireActual('jwk-to-pem');
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const mainFn: any = jest.fn();
	mainFn.JWK = JWK;
	return mainFn;
});

const jwkSet: JwkSet = {
	keys: [
		{
			kty: 'EC',
			crv: '',
			x: '',
			y: ''
		}
	]
};

const jwkToPemMock = jwkToPem as jest.Mock;

describe('TokenKey', () => {
	beforeEach(() => {
		jest.resetAllMocks();
		mockRestClient.reset();
		process.env.AUTH_SERVER_HOST = 'https://authServerHost';
	});

	afterEach(() => {
		delete process.env.AUTH_SERVER_HOST;
	});

	it('loads the TokenKey', async () => {
		mockRestClient.onGet('https://authServerHost/jwk').reply(200, jwkSet);
		jwkToPemMock.mockImplementation(() => 'Success');

		const result = await loadTokenKey()();
		expect(result).toEqualRight({
			key: 'Success'
		});
	});

	it('AUTH_SERVER_HOST variable is not available', async () => {
		delete process.env.AUTH_SERVER_HOST;

		const result = await loadTokenKey()();
		expect(result).toEqualLeft(
			new Error('Auth Server Host variable is not available')
		);

		expect(jwkToPemMock).not.toHaveBeenCalled();
	});
});
