import * as tradierService from '../../services/routes/TradierService';
import { Controller } from './Controller';
import { secureTask } from '../auth/secure';

export const queryTradier: Controller = secureTask(tradierService.queryTradier);
