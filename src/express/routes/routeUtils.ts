import * as Reader from 'fp-ts/Reader';
import { ReaderT } from '@craigmiller160/ts-functions/types';
import { ExpressDependencies, ExpressRouteDependencies } from '../ExpressDependencies';
import { Router } from 'express';

// TODO replace this
export const newRouter = (
	baseUrl: string
): ReaderT<ExpressDependencies, Router> =>
	Reader.asks(({ expressApp }) => {
		const router = Router();
		expressApp.use(baseUrl, router);
		return router;
	});

// TODO new future
export const newRouter2 = (
	baseUrl: string
): ReaderT<ExpressRouteDependencies, Router> =>
	Reader.asks(({ expressApp }) => {
		const router = Router();
		expressApp.use(baseUrl, router);
		return router;
	});
