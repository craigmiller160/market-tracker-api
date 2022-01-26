import { ExpressDependencies } from '../ExpressDependencies';
import { ReaderT } from '@craigmiller160/ts-functions/types';

export type OldRouteCreator = ReaderT<ExpressDependencies, void>;

export type RouteCreator = ReaderT<ExpressDependencies, void>;
