import {
	accessToken,
	createFullTestServer,
	FullTestServer,
	stopFullTestServer
} from '../../testutils/fullTestServer';
import { PortfolioModel } from '../../../src/mongo/models/PortfolioModel';
import { Portfolio } from '../../../src/data/modelTypes/Portfolio';
import { getUserId } from '../../../src/keycloak/KeycloakToken';

describe('PortfolioModel', () => {
	let fullTestServer: FullTestServer;
	beforeAll(async () => {
		fullTestServer = await createFullTestServer();
	});

	afterAll(async () => {
		await stopFullTestServer(fullTestServer);
	});

	afterEach(async () => {
		await PortfolioModel.deleteMany().exec();
	});

	it('enforces optimistic locking', async () => {
		const portfolio: Portfolio = {
			userId: getUserId(accessToken),
			portfolioName: 'Hello',
			stocks: [],
			cryptos: []
		};
		await new PortfolioModel(portfolio).save();

		const existing1 = (await PortfolioModel.find().exec())[0];
		const existing2 = (await PortfolioModel.find().exec())[0];

		existing1.stocks.push({ symbol: 'ABC', shares: 1 });
		await existing1.save();

		const result = (await PortfolioModel.find().exec())[0];
		expect(result.toObject()).toEqual({
			...portfolio,
			_id: existing1._id,
			__v: 1,
			stocks: [{ _id: expect.anything(), symbol: 'ABC', shares: 1 }]
		});

		existing2.cryptos.push({ symbol: 'DEF', shares: 1 });
		try {
			await existing2.save();
		} catch (ex) {
			const error = ex as Error;
			expect(error.name).toEqual('VersionError');
			expect(error.message).toContain('No matching document found');
			return;
		}
		fail('Should have thrown exception');
	});
});
