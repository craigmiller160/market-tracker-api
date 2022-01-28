import { ReaderTaskRoute, Route } from './Route';
import { ReaderT } from '@craigmiller160/ts-functions/types';
import { ExpressDependencies } from './ExpressDependencies';

export const readerTaskRouteToReaderRoute =
	<T>(fn: ReaderTaskRoute<T>): ReaderT<ExpressDependencies, Route> =>
	(dependencies) =>
	(req, res, next) =>
		fn(req, res, next)(dependencies)();
