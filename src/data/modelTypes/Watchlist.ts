export interface WatchlistItem {
	readonly symbol: string;
}

export interface WatchlistInput {
	readonly watchlistName: string;
	readonly stocks: ReadonlyArray<WatchlistItem>;
	readonly cryptos: ReadonlyArray<WatchlistItem>;
}

export interface Watchlist extends WatchlistInput {
	readonly userId: number;
}

export interface WatchlistNameAndId {
	readonly id: string;
	readonly name: string;
}
