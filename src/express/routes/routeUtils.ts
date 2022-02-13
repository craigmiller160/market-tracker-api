import * as Reader from 'fp-ts/Reader';
import { ReaderT } from '@craigmiller160/ts-functions/types';
import {
	ExpressDependencies,
	ExpressRouteDependencies
} from '../ExpressDependencies';
import { NextFunction, Request, Response, Router } from 'express';

// TODO replace this
export const newRouter = (
	baseUrl: string
): ReaderT<ExpressDependencies, Router> =>
	Reader.asks(({ expressApp }) => {
		const router = Router();
		expressApp.use(baseUrl, router);
		return router;
	});

// TODO move to another file
const emptyRoute = (req: Request, res: Response, next: NextFunction) => next();

// TODO rename
export const newRouter2 = (
	baseUrl: string
): ReaderT<ExpressRouteDependencies, Router> => createNewRouter(baseUrl, false);

export const newSecureRouter = (
	baseUrl: string
): ReaderT<ExpressRouteDependencies, Router> => createNewRouter(baseUrl, true);

const createNewRouter = (
	baseUrl: string,
	isSecure: boolean
): ReaderT<ExpressRouteDependencies, Router> =>
	Reader.asks(({ expressApp, secure2 }) => {
		const middleware = isSecure ? secure2 : emptyRoute;
		const router = Router();
		expressApp.use(baseUrl, middleware, router);
		return router;
	});
