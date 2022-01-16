import { Express } from 'express';

export type RouteCreator = (app: Express) => void;
