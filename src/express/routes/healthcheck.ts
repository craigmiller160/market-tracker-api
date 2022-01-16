import { RouteCreator } from './RouteCreator';

export const healthcheck: RouteCreator = (app) =>
	app.get('/healthcheck', (req, res) => {
		res.send('Healthy');
	});
