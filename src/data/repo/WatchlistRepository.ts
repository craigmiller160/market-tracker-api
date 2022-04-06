import { TaskTryT } from '@craigmiller160/ts-functions/types';
import { Watchlist, WatchlistInput } from '../modelTypes/Watchlist';

export type FindWatchlistsForUser = (
	userId: number
) => TaskTryT<ReadonlyArray<Watchlist>>;

export type SaveWatchlistsForUser = (
	userId: number,
	watchlists: ReadonlyArray<Watchlist>
) => TaskTryT<unknown>;

export type CreateWatchlistForUser = (
	userId: number,
	watchlist: WatchlistInput
) => TaskTryT<Watchlist>;

export interface WatchlistRepository {
	readonly findWatchlistsForUser: FindWatchlistsForUser;
	readonly saveWatchlistsForUser: SaveWatchlistsForUser;
	readonly createWatchlistForUser: CreateWatchlistForUser;
}
