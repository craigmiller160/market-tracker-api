import { Express } from 'express';
import * as Reader from 'fp-ts/Reader';
import { RouteDependencies } from './RouteDependencies';

// TODO remove this
export type OldRouteCreator = (app: Express) => void;

export type RouteCreator = Reader.Reader<RouteDependencies, void>;
