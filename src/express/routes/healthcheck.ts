import { RouteCreator } from './RouteCreator';
import * as Reader from 'fp-ts/Reader';
import { pipe } from 'fp-ts/function';
import * as healthcheckController from '../controllers/healthcheck';
import { newRouter } from './routeUtils';

export const createHealthcheckRoutes: RouteCreator = pipe(
	newRouter('/healthcheck'),
	Reader.bindTo('router'),
	Reader.bind('healthcheck', () => healthcheckController.healthcheck),
	Reader.map(({ router, healthcheck }) => {
		router.get('/', healthcheck);
		return router;
	})
);
