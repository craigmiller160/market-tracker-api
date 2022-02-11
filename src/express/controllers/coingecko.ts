import * as coinGeckoService from '../../services/routes/CoinGeckoService';
import { Controller } from './Controller';
import { secureTask } from '../auth/secure';

export const queryCoinGecko: Controller = secureTask(
	coinGeckoService.queryCoinGecko
);
