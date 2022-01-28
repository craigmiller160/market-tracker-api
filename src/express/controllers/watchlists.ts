import { Controller } from './Controller';
import { secureReaderTask } from '../auth/secure';
import * as watchlistService from '../../services/routes/WatchlistService';

export const getWatchlistsForUser: Controller = secureReaderTask(
	watchlistService.getWatchlistsByUser
);

export const saveWatchlistsForUser: Controller = secureReaderTask(
	watchlistService.saveWatchlistsByUser
);
