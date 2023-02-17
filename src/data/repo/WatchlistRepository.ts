import { OptionT, TaskTryT } from '@craigmiller160/ts-functions/types';
import { Watchlist, WatchlistInput } from '../modelTypes/Watchlist';

export type FindWatchlistsForUser = (
	userId: string
) => TaskTryT<ReadonlyArray<Watchlist>>;

export type SaveWatchlistsForUser = (
	userId: string,
	watchlists: ReadonlyArray<Watchlist>
) => TaskTryT<unknown>;

export type CreateWatchlistForUser = (
	userId: string,
	watchlist: WatchlistInput
) => TaskTryT<Watchlist>;

export type GetAllNamesForUser = (
	userId: string
) => TaskTryT<ReadonlyArray<string>>;

export type InvestmentType = 'stock' | 'crypto';

export type AddInvestmentForUser = (
	userId: string,
	watchlistName: string,
	type: InvestmentType,
	symbol: string
) => TaskTryT<OptionT<Watchlist>>;

export type RemoveInvestmentForUser = (
	userId: string,
	watchlistName: string,
	type: InvestmentType,
	symbol: string
) => TaskTryT<OptionT<Watchlist>>;

export type RemoveWatchlistForUser = (
	userId: string,
	watchlistName: string
) => TaskTryT<OptionT<unknown>>;

export type RenameWatchlistForUser = (
	userId: string,
	oldWatchlistName: string,
	newWatchlistName: string
) => TaskTryT<void>;

export interface WatchlistRepository {
	readonly findWatchlistsForUser: FindWatchlistsForUser;
	readonly saveWatchlistsForUser: SaveWatchlistsForUser;
	readonly createWatchlistForUser: CreateWatchlistForUser;
	readonly getAllNamesForUser: GetAllNamesForUser;
	readonly addInvestmentForUser: AddInvestmentForUser;
	readonly removeInvestmentForUser: RemoveInvestmentForUser;
	readonly removeWatchlistForUser: RemoveWatchlistForUser;
	readonly renameWatchlistForUser: RenameWatchlistForUser;
}
