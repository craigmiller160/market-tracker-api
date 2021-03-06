import { ReaderT } from '@craigmiller160/ts-functions/types';
import { IORoute, Route } from './Route';
import { ExpressDependencies } from './ExpressDependencies';

export const ioRouteToReaderRoute =
	(fn: IORoute): ReaderT<ExpressDependencies, Route> =>
	() =>
	(req, res, next) =>
		fn(req, res, next)();
