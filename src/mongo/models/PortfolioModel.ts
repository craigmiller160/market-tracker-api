import { model, Schema } from 'mongoose';
import { Portfolio } from '../../data/modelTypes/Portfolio';

const portfolioSchema = new Schema<Portfolio>(
	{
		userId: {
			type: String,
			required: true
		},
		portfolioName: {
			type: String,
			required: true
		},
		stocks: [
			{
				symbol: String,
				shares: Number
			}
		],
		cryptos: [
			{
				symbol: String,
				shares: Number
			}
		]
	},
	{
		optimisticConcurrency: true
	}
);

export const PortfolioModel = model<Portfolio>('portfolio', portfolioSchema);
export type PortfolioModelType = typeof PortfolioModel;

const exampleModel = new PortfolioModel();

export type PortfolioModelInstanceType = typeof exampleModel;

export const portfolioToModel = (
	portfolio: Portfolio
): PortfolioModelInstanceType => new PortfolioModel(portfolio);
