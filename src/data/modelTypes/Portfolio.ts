export interface PortfolioItem {
	symbol: string;
	shares: number;
}

export interface Portfolio {
	userId: string;
	portfolioName: string;
	stocks: PortfolioItem[];
	cryptos: PortfolioItem[];
}
