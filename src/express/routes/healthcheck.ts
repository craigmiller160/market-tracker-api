import { OldRouteCreator } from './RouteCreator';

export const healthcheck: OldRouteCreator = (dependencies) =>
	dependencies.expressApp.get('/healthcheck', (req, res) => {
		res.send('Healthy');
	});
