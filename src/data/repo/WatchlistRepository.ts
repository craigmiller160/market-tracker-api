import { OptionT, TaskTryT } from '@craigmiller160/ts-functions/types';
import {
	Watchlist,
	WatchlistInput,
	WatchlistNameAndId
} from '../modelTypes/Watchlist';

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

export type GetAllNamesForUser = (
	userId: number
) => TaskTryT<ReadonlyArray<WatchlistNameAndId>>;

export type InvestmentType = 'stock' | 'crypto';

export type AddInvestmentForUser = (
	userId: number,
	watchlistName: string,
	type: InvestmentType,
	symbol: string
) => TaskTryT<OptionT<Watchlist>>;

export type RemoveInvestmentForUser = (
	userId: number,
	watchlistName: string,
	type: InvestmentType,
	symbol: string
) => TaskTryT<OptionT<Watchlist>>;

export type RemoveWatchlistForUser = (
	userId: number,
	watchlistName: string
) => TaskTryT<void>;

export interface WatchlistRepository {
	readonly findWatchlistsForUser: FindWatchlistsForUser;
	readonly saveWatchlistsForUser: SaveWatchlistsForUser;
	readonly createWatchlistForUser: CreateWatchlistForUser;
	readonly getAllNamesForUser: GetAllNamesForUser;
	readonly addInvestmentForUser: AddInvestmentForUser;
	readonly removeInvestmentForUser: RemoveInvestmentForUser;
	readonly removeWatchlistForUser: RemoveWatchlistForUser;
}
