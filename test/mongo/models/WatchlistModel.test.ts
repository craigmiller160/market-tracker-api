import { Watchlist } from '../../../src/data/modelTypes/Watchlist';
import {
	accessToken,
	createFullTestServer,
	FullTestServer,
	stopFullTestServer
} from '../../testutils/fullTestServer';
import { WatchlistModel } from '../../../src/mongo/models/WatchlistModel';
import { getUserId } from '../../../src/keycloak/KeycloakToken';

describe('WatchlistModel', () => {
	let fullTestServer: FullTestServer;
	beforeAll(async () => {
		fullTestServer = await createFullTestServer();
	});

	afterAll(async () => {
		await stopFullTestServer(fullTestServer);
	});

	afterEach(async () => {
		await WatchlistModel.deleteMany().exec();
	});

	it('enforces optimistic locking', async () => {
		const watchlist: Watchlist = {
			watchlistName: 'Hello',
			stocks: [],
			cryptos: [],
			userId: getUserId(accessToken)
		};
		await new WatchlistModel(watchlist).save();

		const existing1 = (await WatchlistModel.find().exec())[0];
		const existing2 = (await WatchlistModel.find().exec())[0];

		existing1.stocks.push({ symbol: 'ABC' });
		await existing1.save();

		const result = (await WatchlistModel.find().exec())[0];
		expect(result.toObject()).toEqual({
			...watchlist,
			_id: existing1._id,
			__v: 1,
			stocks: [{ _id: expect.anything(), symbol: 'ABC' }]
		});

		existing2.cryptos.push({ symbol: 'DEF' });
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
