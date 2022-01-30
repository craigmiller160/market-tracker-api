import * as tradierService from '../../services/routes/TradierService';
import { Controller } from './Controller';
import * as Reader from 'fp-ts/Reader';

export const queryTradier: Controller = Reader.of((req, res, next) =>
	tradierService.queryTradier(req, res, next)()
);
