import request from 'supertest';
import {
	PortfolioModel,
	portfolioToModel
} from '../../../src/mongo/models/PortfolioModel';
import {
	accessToken,
	createAccessToken,
	createFullTestServer,
	FullTestServer,
	stopFullTestServer
} from '../../testutils/fullTestServer';
import { removeId } from '../../testutils/functions';
import { Portfolio } from '../../../src/data/modelTypes/Portfolio';
import { nanoid } from 'nanoid';
import { getUserId } from '../../../src/keycloak/KeycloakToken';

const formatPortfolios = (portfolios: Portfolio[]): Portfolio[] =>
	portfolios.map((portfolio) => {
		const newPortfolio = removeId(portfolio);
		return {
			...newPortfolio,
			stocks: newPortfolio.stocks.map(removeId),
			cryptos: newPortfolio.cryptos.map(removeId)
		};
	});

describe('portfolios', () => {
	let user1InitPortfolios: Portfolio[];
	let fullTestServer: FullTestServer;
	beforeAll(async () => {
		fullTestServer = await createFullTestServer();
	});

	afterAll(async () => {
		await stopFullTestServer(fullTestServer);
	});

	beforeEach(async () => {
		user1InitPortfolios = [
			{
				userId: getUserId(accessToken),
				portfolioName: 'One',
				stocks: [
					{
						symbol: 'ABC',
						shares: 1
					},
					{ symbol: 'DEF', shares: 2 }
				],
				cryptos: [{ symbol: 'GHI', shares: 3 }]
			},
			{
				userId: getUserId(accessToken),
				portfolioName: 'Two',
				stocks: [
					{
						symbol: 'QRS',
						shares: 1
					},
					{
						symbol: 'QRS',
						shares: 2
					}
				],
				cryptos: [
					{
						symbol: 'QRS',
						shares: 3
					}
				]
			}
		];
		const user1Models = user1InitPortfolios.map(portfolioToModel);
		await PortfolioModel.insertMany(user1Models);

		const user2Portfolios: Portfolio[] = [
			{
				userId: nanoid(),
				portfolioName: 'Three',
				stocks: [
					{
						symbol: 'ABC2',
						shares: 1
					},
					{
						symbol: 'DEF2',
						shares: 2
					}
				],
				cryptos: [
					{
						symbol: 'GHI2',
						shares: 3
					}
				]
			}
		];
		const user2Models = user2Portfolios.map(portfolioToModel);
		await PortfolioModel.insertMany(user2Models);
	});

	afterEach(async () => {
		await PortfolioModel.deleteMany().exec();
	});

	describe('getPortfolios', () => {
		it('successful auth', async () => {
			const token = createAccessToken(fullTestServer.keyPair.privateKey);
			const res = await request(fullTestServer.expressServer.server)
				.get('/portfolios')
				.set('Authorization', `Bearer ${token}`)
				.timeout(2000)
				.expect(200);

			expect(formatPortfolios(res.body as Portfolio[])).toEqual(
				user1InitPortfolios
			);
		});

		it('failed auth', async () => {
			await request(fullTestServer.expressServer.server)
				.get('/portfolios')
				.timeout(2000)
				.expect(401);
		});
	});

	describe('savePortfolios', () => {
		const newPortfolios: Portfolio[] = [
			{
				userId: nanoid(),
				portfolioName: 'Ten',
				stocks: [
					{
						symbol: 'atv',
						shares: 1
					}
				],
				cryptos: []
			}
		];

		it('successful auth', async () => {
			const token = createAccessToken(fullTestServer.keyPair.privateKey);
			const res = await request(fullTestServer.expressServer.server)
				.post('/portfolios')
				.timeout(2000)
				.set('Content-Type', 'application/json')
				.set('Authorization', `Bearer ${token}`)
				.send(newPortfolios)
				.expect(200);
			expect(formatPortfolios(res.body)).toEqual([
				{
					...newPortfolios[0],
					userId: getUserId(accessToken)
				}
			]);
			const results = await PortfolioModel.find({
				userId: getUserId(accessToken)
			})
				.lean()
				.exec();
			expect(results).toHaveLength(1);

			const resultsWithoutIds = formatPortfolios(results);

			expect(resultsWithoutIds[0]).toEqual({
				...newPortfolios[0],
				userId: getUserId(accessToken)
			});
		});

		it('failed auth', async () => {
			await request(fullTestServer.expressServer.server)
				.post('/portfolios')
				.timeout(2000)
				.set('Content-Type', 'application/json')
				.send(newPortfolios)
				.expect(401);
		});
	});
});
