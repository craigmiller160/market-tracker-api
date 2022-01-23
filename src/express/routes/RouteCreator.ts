import { Express } from 'express';
import * as Reader from 'fp-ts/Reader';
import { ExpressDependencies } from '../ExpressDependencies';

// TODO remove this
export type OldRouteCreator = (app: Express) => void;

export type RouteCreator = Reader.Reader<ExpressDependencies, void>;
