export interface WatchlistItem {
	symbol: string;
}

export interface Watchlist {
	userId: number;
	watchlistName: string;
	stocks: WatchlistItem[];
	cryptos: WatchlistItem[];
}
