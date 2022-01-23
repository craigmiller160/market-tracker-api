import { OldRouteCreator } from './RouteCreator';

export const healthcheck: OldRouteCreator = (app) =>
	app.get('/healthcheck', (req, res) => {
		res.send('Healthy');
	});
