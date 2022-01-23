import {
	WatchlistModel,
	watchlistToModel
} from '../../../src/mongo/models/WatchlistModel';
import request from 'supertest';
import {
	createAccessToken,
	createFullTestServer,
	FullTestServer,
	stopFullTestServer
} from '../../testutils/fullTestServer';
import { removeId } from '../../testutils/functions';
import { Watchlist } from '../../../src/data/modelTypes/Watchlist';

const formatWatchlists = (watchlists: Watchlist[]): Watchlist[] =>
	watchlists.map((watchlist) => {
		const newWatchlist = removeId(watchlist);
		return {
			...newWatchlist,
			stocks: newWatchlist.stocks.map(removeId),
			cryptos: newWatchlist.cryptos.map(removeId)
		};
	});

describe('watchlists route', () => {
	let user1InitWatchlists: Watchlist[];
	let fullTestServer: FullTestServer;
	beforeAll(async () => {
		fullTestServer = await createFullTestServer();
	});

	afterAll(async () => {
		await stopFullTestServer(fullTestServer);
	});

	beforeEach(async () => {
		user1InitWatchlists = [
			{
				userId: 1,
				watchlistName: 'One',
				stocks: [
					{
						symbol: 'ABC'
					},
					{
						symbol: 'DEF'
					}
				],
				cryptos: [
					{
						symbol: 'GHI'
					}
				]
			},
			{
				userId: 1,
				watchlistName: 'Two',
				stocks: [
					{
						symbol: 'QRS'
					},
					{
						symbol: 'TUV'
					}
				],
				cryptos: [
					{
						symbol: 'WXYZ'
					}
				]
			}
		];
		const user1Watchlists = user1InitWatchlists.map(watchlistToModel);
		await WatchlistModel.insertMany(user1Watchlists);

		const user2Watchlists: Watchlist[] = [
			{
				userId: 2,
				watchlistName: 'Three',
				stocks: [
					{
						symbol: 'ABC2'
					},
					{
						symbol: 'DEF2'
					}
				],
				cryptos: [
					{
						symbol: 'GHI2'
					}
				]
			}
		];
		const user2Models = user2Watchlists.map(watchlistToModel);
		await WatchlistModel.insertMany(user2Models);
	});

	afterEach(async () => {
		await WatchlistModel.deleteMany().exec();
	});

	describe('getWatchlists', () => {
		it('successful auth', async () => {
			const token = createAccessToken(fullTestServer.keyPair.privateKey);
			const res = await request(fullTestServer.expressServer.server)
				.get('/watchlists')
				.set('Authorization', `Bearer ${token}`)
				.timeout(2000)
				.expect(200);
			expect(formatWatchlists(res.body)).toEqual([
				expect.objectContaining(user1InitWatchlists[0]),
				expect.objectContaining(user1InitWatchlists[1])
			]);
		});

		it('failed auth', async () => {
			await request(fullTestServer.expressServer.server)
				.get('/watchlists')
				.timeout(2000)
				.expect(401);
		});
	});

	describe('saveWatchlists', () => {
		const newWatchlists: Watchlist[] = [
			{
				userId: 10,
				watchlistName: 'Ten',
				stocks: [
					{
						symbol: 'atv'
					}
				],
				cryptos: []
			}
		];

		it('successful auth', async () => {
			const token = createAccessToken(fullTestServer.keyPair.privateKey);
			const res = await request(fullTestServer.expressServer.server)
				.post('/watchlists')
				.timeout(2000)
				.set('Authorization', `Bearer ${token}`)
				.set('Content-Type', 'application/json')
				.send(newWatchlists)
				.expect(200);
			expect(formatWatchlists(res.body)).toEqual([
				expect.objectContaining({
					...newWatchlists[0],
					userId: 1
				})
			]);

			const results = await WatchlistModel.find({ userId: 1 })
				.lean()
				.exec();
			expect(results).toHaveLength(1);

			const resultsWithoutIds = formatWatchlists(results);

			expect(resultsWithoutIds[0]).toEqual({
				...newWatchlists[0],
				userId: 1
			});
		});

		it('failed auth', async () => {
			await request(fullTestServer.expressServer.server)
				.post('/watchlists')
				.timeout(2000)
				.set('Content-Type', 'application/json')
				.send(newWatchlists)
				.expect(401);
		});
	});
});
