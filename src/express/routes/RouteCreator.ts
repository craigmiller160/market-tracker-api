import { ExpressRouteDependencies } from '../ExpressDependencies';
import { ReaderT } from '@craigmiller160/ts-functions/types';

export type RouteCreator = ReaderT<ExpressRouteDependencies, void>;
