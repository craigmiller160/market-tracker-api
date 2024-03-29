import {
	WatchlistModel,
	watchlistToModel
} from '../../../src/mongo/models/WatchlistModel';
import request from 'supertest';
import {
	accessToken,
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
import { getUserId } from '../../../src/keycloak/KeycloakToken';
import { nanoid } from 'nanoid';

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
				userId: getUserId(accessToken),
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
				userId: getUserId(accessToken),
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
				userId: nanoid(),
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

	describe('renameWatchlist', () => {
		it('successfully renames watchlist', async () => {
			const token = createAccessToken(fullTestServer.keyPair.privateKey);
			await request(fullTestServer.expressServer.server)
				.put('/watchlists/One/rename/FooBar')
				.set('Authorization', `Bearer ${token}`)
				.timeout(2000)
				.expect(204);

			const oldNameCount = await WatchlistModel.count({
				watchlistName: 'One'
			}).exec();
			expect(oldNameCount).toEqual(0);

			const newNameCount = await WatchlistModel.count({
				watchlistName: 'FooBar'
			}).exec();
			expect(newNameCount).toEqual(1);
		});

		it('no match for watchlist', async () => {
			const token = createAccessToken(fullTestServer.keyPair.privateKey);
			await request(fullTestServer.expressServer.server)
				.put('/watchlists/asdf/rename/FooBar')
				.set('Authorization', `Bearer ${token}`)
				.timeout(2000)
				.expect(400);
		});

		it('failed auth', async () => {
			await request(fullTestServer.expressServer.server)
				.put('/watchlists/One/rename/FooBar')
				.timeout(2000)
				.expect(401);
		});
	});

	describe('removeWatchlist', () => {
		it('removes watchlist', async () => {
			const token = createAccessToken(fullTestServer.keyPair.privateKey);
			await request(fullTestServer.expressServer.server)
				.delete('/watchlists/One')
				.set('Authorization', `Bearer ${token}`)
				.timeout(2000)
				.expect(204);
			const watchlists = await WatchlistModel.find({
				userId: getUserId(accessToken)
			}).exec();
			expect(watchlists).toHaveLength(1);
		});

		it('no watchlist with the name exists to remove', async () => {
			const token = createAccessToken(fullTestServer.keyPair.privateKey);
			await request(fullTestServer.expressServer.server)
				.delete('/watchlists/asdf')
				.set('Authorization', `Bearer ${token}`)
				.timeout(2000)
				.expect(400);
		});

		it('failed auth', async () => {
			await request(fullTestServer.expressServer.server)
				.delete('/watchlists/One')
				.timeout(2000)
				.expect(401);
		});
	});

	describe('removeStockFromWatchlist', () => {
		it('successfully removes stock', async () => {
			const token = createAccessToken(fullTestServer.keyPair.privateKey);
			await request(fullTestServer.expressServer.server)
				.delete('/watchlists/One/stock/ABC')
				.set('Authorization', `Bearer ${token}`)
				.timeout(2000)
				.expect(200);
			const watchlist = await WatchlistModel.findOne({
				watchlistName: 'One'
			}).exec();
			expect(watchlist?.stocks).toEqual([
				expect.objectContaining({
					symbol: 'DEF'
				})
			]);
		});

		it('watchlist does not exist for removing stock', async () => {
			const token = createAccessToken(fullTestServer.keyPair.privateKey);
			await request(fullTestServer.expressServer.server)
				.delete('/watchlists/asdf/stock/ABC')
				.set('Authorization', `Bearer ${token}`)
				.timeout(2000)
				.expect(400);
		});

		it('failed auth', async () => {
			await request(fullTestServer.expressServer.server)
				.delete('/watchlists/One/stock/ABC')
				.timeout(2000)
				.expect(401);
		});
	});

	describe('removeCryptoFromWatchlist', () => {
		it('successfully removes crypto', async () => {
			const token = createAccessToken(fullTestServer.keyPair.privateKey);
			await request(fullTestServer.expressServer.server)
				.delete('/watchlists/One/crypto/GHI')
				.set('Authorization', `Bearer ${token}`)
				.timeout(2000)
				.expect(200);
			const watchlist = await WatchlistModel.findOne({
				watchlistName: 'One'
			}).exec();
			expect(watchlist?.cryptos).toEqual([]);
		});

		it('watchlist does not exist for removing crypto', async () => {
			const token = createAccessToken(fullTestServer.keyPair.privateKey);
			await request(fullTestServer.expressServer.server)
				.delete('/watchlists/asdf/crypto/GHI')
				.set('Authorization', `Bearer ${token}`)
				.timeout(2000)
				.expect(400);
		});

		it('failed auth', async () => {
			await request(fullTestServer.expressServer.server)
				.delete('/watchlists/One/crypto/GHI')
				.timeout(2000)
				.expect(401);
		});
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
				user1InitWatchlists[0].watchlistName,
				user1InitWatchlists[1].watchlistName
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
					userId: getUserId(accessToken),
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
				userId: nanoid(),
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
					userId: getUserId(accessToken),
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
					userId: getUserId(accessToken)
				})
			]);

			const results = await WatchlistModel.find({
				userId: getUserId(accessToken)
			})
				.lean()
				.exec();
			expect(results).toHaveLength(1);

			const resultsWithoutIds = formatWatchlists(results);

			expect(resultsWithoutIds[0]).toEqual({
				...newWatchlists[0],
				userId: getUserId(accessToken)
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
