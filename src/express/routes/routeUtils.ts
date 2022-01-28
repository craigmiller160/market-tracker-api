import * as Reader from 'fp-ts/Reader';
import { ReaderT } from '@craigmiller160/ts-functions/types';
import { ExpressDependencies } from '../ExpressDependencies';
import { Router } from 'express';

export const newRouter = (
	baseUrl: string
): ReaderT<ExpressDependencies, Router> =>
	Reader.asks(({ expressApp }) => {
		const router = Router();
		expressApp.use(baseUrl, router);
		return router;
	});
