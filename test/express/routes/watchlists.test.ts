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
import {
	Watchlist,
	WatchlistInput
} from '../../../src/data/modelTypes/Watchlist';

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

	describe('addStockToWatchlist', () => {
		it('successfully adds stock', async () => {
			const token = createAccessToken(fullTestServer.keyPair.privateKey);
			await request(fullTestServer.expressServer.server)
				.put('/watchlists/One/stock/NEW')
				.set('Authorization', `Bearer ${token}`)
				.timeout(2000)
				.expect(200);
			const watchlist = await WatchlistModel.findOne({
				watchlistName: 'One'
			}).exec();
			expect(watchlist?.stocks).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						symbol: 'NEW'
					})
				])
			);
		});

		it('watchlist does not exist for adding stock', async () => {
			const token = createAccessToken(fullTestServer.keyPair.privateKey);
			await request(fullTestServer.expressServer.server)
				.put('/watchlists/asdf/stock/NEW')
				.set('Authorization', `Bearer ${token}`)
				.timeout(2000)
				.expect(400);
		});

		it('failed auth', async () => {
			await request(fullTestServer.expressServer.server)
				.put('/watchlists/One/stock/NEW')
				.timeout(2000)
				.expect(401);
		});
	});

	describe('addCryptoToWatchlist', () => {
		it('successfully adds crypto', async () => {
			const token = createAccessToken(fullTestServer.keyPair.privateKey);
			await request(fullTestServer.expressServer.server)
				.put('/watchlists/One/crypto/NEW')
				.set('Authorization', `Bearer ${token}`)
				.timeout(2000)
				.expect(200);
			const watchlist = await WatchlistModel.findOne({
				watchlistName: 'One'
			}).exec();
			expect(watchlist?.cryptos).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						symbol: 'NEW'
					})
				])
			);
		});

		it('watchlist does not exist for adding crypto', async () => {
			const token = createAccessToken(fullTestServer.keyPair.privateKey);
			await request(fullTestServer.expressServer.server)
				.put('/watchlists/asdf/crypto/NEW')
				.set('Authorization', `Bearer ${token}`)
				.timeout(2000)
				.expect(400);
		});

		it('failed auth', async () => {
			await request(fullTestServer.expressServer.server)
				.put('/watchlists/One/crypto/NEW')
				.timeout(2000)
				.expect(401);
		});
	});

	describe('getAllNames', () => {
		it('successfully gets names', async () => {
			const token = createAccessToken(fullTestServer.keyPair.privateKey);
			const res = await request(fullTestServer.expressServer.server)
				.get('/watchlists/names')
				.set('Authorization', `Bearer ${token}`)
				.timeout(2000)
				.expect(200);
			expect(res.body).toEqual([
				{
					id: expect.any(String),
					watchlistName: user1InitWatchlists[0].watchlistName
				},
				{
					id: expect.any(String),
					watchlistName: user1InitWatchlists[1].watchlistName
				}
			]);
		});

		it('failed auth', async () => {
			await request(fullTestServer.expressServer.server)
				.get('/watchlists/names')
				.timeout(2000)
				.expect(401);
		});
	});

	describe('getWatchlists', () => {
		it('successful auth', async () => {
			const token = createAccessToken(fullTestServer.keyPair.privateKey);
			const res = await request(fullTestServer.expressServer.server)
				.get('/watchlists/all')
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
				.get('/watchlists/all')
				.timeout(2000)
				.expect(401);
		});
	});

	describe('createWatchlist', () => {
		const watchlistInput: WatchlistInput = {
			watchlistName: 'Hello',
			stocks: [],
			cryptos: []
		};

		it('successfully creates watchlist', async () => {
			const token = createAccessToken(fullTestServer.keyPair.privateKey);
			const res = await request(fullTestServer.expressServer.server)
				.post('/watchlists')
				.set('Authorization', `Bearer ${token}`)
				.timeout(2000)
				.set('Content-Type', 'application/json')
				.send(watchlistInput)
				.expect(200);
			expect(res.body).toEqual(
				expect.objectContaining({
					userId: 1,
					watchlistName: 'Hello',
					stocks: [],
					cryptos: []
				})
			);
		});

		it('rejects watchlist with duplicate name', async () => {
			const badInput: WatchlistInput = {
				...watchlistInput,
				watchlistName: 'One'
			};
			const token = createAccessToken(fullTestServer.keyPair.privateKey);
			await request(fullTestServer.expressServer.server)
				.post('/watchlists')
				.set('Authorization', `Bearer ${token}`)
				.timeout(2000)
				.set('Content-Type', 'application/json')
				.send(badInput)
				.expect(400);
		});

		it('failed auth', async () => {
			await request(fullTestServer.expressServer.server)
				.post('/watchlists')
				.timeout(2000)
				.set('Content-Type', 'application/json')
				.send(watchlistInput)
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

		it('rejects watchlists with duplicate names', async () => {
			const newNewWatchlists: ReadonlyArray<Watchlist> = [
				...newWatchlists,
				{
					userId: 1,
					watchlistName: 'Ten',
					stocks: [
						{
							symbol: 'atv'
						}
					],
					cryptos: []
				}
			];
			const token = createAccessToken(fullTestServer.keyPair.privateKey);
			await request(fullTestServer.expressServer.server)
				.post('/watchlists/all')
				.timeout(2000)
				.set('Authorization', `Bearer ${token}`)
				.set('Content-Type', 'application/json')
				.send(newNewWatchlists)
				.expect(400);
		});

		it('successfully saves watchlists', async () => {
			const token = createAccessToken(fullTestServer.keyPair.privateKey);
			const res = await request(fullTestServer.expressServer.server)
				.post('/watchlists/all')
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
				.post('/watchlists/all')
				.timeout(2000)
				.set('Content-Type', 'application/json')
				.send(newWatchlists)
				.expect(401);
		});
	});
});
