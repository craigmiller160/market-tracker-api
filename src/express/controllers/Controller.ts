import { ExpressDependencies } from '../ExpressDependencies';
import { Route } from '../Route';
import { ReaderT } from '@craigmiller160/ts-functions/types';

export type Controller = ReaderT<ExpressDependencies, Route>;
