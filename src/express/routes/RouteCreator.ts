import { ExpressDependencies } from '../ExpressDependencies';
import { ReaderT } from '@craigmiller160/ts-functions/types';

export type RouteCreator = ReaderT<ExpressDependencies, void>;
