import { model, Schema } from 'mongoose';

export interface PortfolioItem {
	symbol: string;
	shares: number;
}

export interface Portfolio {
	userId: number;
	portfolioName: string;
	stocks: PortfolioItem[];
	cryptos: PortfolioItem[];
}

const portfolioSchema = new Schema<Portfolio>({
	userId: {
		type: Number,
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
});

export const PortfolioModel = model<Portfolio>('portfolio', portfolioSchema);
export type PortfolioModelType = typeof PortfolioModel;

const exampleModel = new PortfolioModel();

export type PortfolioModelInstanceType = typeof exampleModel;

export const portfolioToModel = (
	portfolio: Portfolio
): PortfolioModelInstanceType => new PortfolioModel(portfolio);
