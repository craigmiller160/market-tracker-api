import * as Reader from 'fp-ts/Reader';
import { ExpressDependencies } from '../ExpressDependencies';

export type RouteCreator = Reader.Reader<ExpressDependencies, void>;
