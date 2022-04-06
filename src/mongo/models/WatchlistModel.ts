import { model, Schema } from 'mongoose';
import { Watchlist } from '../../data/modelTypes/Watchlist';

const watchlistSchema = new Schema<Watchlist>({
	userId: {
		type: Number,
		required: true
	},
	watchlistName: {
		type: String,
		required: true,
		unique: true
	},
	stocks: [
		{
			symbol: String
		}
	],
	cryptos: [
		{
			symbol: String
		}
	]
});

export const WatchlistModel = model<Watchlist>('watchlist', watchlistSchema);
export type WatchlistModelType = typeof WatchlistModel;

const exampleWatchlist = new WatchlistModel();

export type WatchlistModelInstanceType = typeof exampleWatchlist;

export const watchlistToModel = (
	watchlist: Watchlist
): WatchlistModelInstanceType => new WatchlistModel(watchlist);
