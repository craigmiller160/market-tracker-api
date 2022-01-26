import { RouteCreator } from './RouteCreator';
import * as Reader from 'fp-ts/Reader';
import { pipe } from 'fp-ts/function';
import { Router } from 'express';
import * as healthcheckController from '../controllers/healthcheck';

export const createHealthcheckRoutes: RouteCreator = pipe(
	Reader.of(Router()),
	Reader.bindTo('router'),
	Reader.bind('healthcheck', () => healthcheckController.healthcheck),
	Reader.map(({ router, healthcheck }) => {
		router.get('/', healthcheck);
		return router;
	})
);
