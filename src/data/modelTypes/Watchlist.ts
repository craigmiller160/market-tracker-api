export interface WatchlistItem {
	symbol: string;
}

export interface WatchlistInput {
	watchlistName: string;
	stocks: WatchlistItem[];
	cryptos: WatchlistItem[];
}

export interface Watchlist extends WatchlistInput {
	userId: number;
}

export interface WatchlistNameAndId {
	id: string;
	watchlistName: string;
}
