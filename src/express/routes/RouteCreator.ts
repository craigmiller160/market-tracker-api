import {
	ExpressDependencies,
	ExpressRouteDependencies
} from '../ExpressDependencies';
import { ReaderT } from '@craigmiller160/ts-functions/types';

// TODO delete this
export type RouteCreator2 = ReaderT<ExpressDependencies, void>;

export type RouteCreator = ReaderT<ExpressRouteDependencies, void>;
