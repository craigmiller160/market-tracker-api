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
