import { RouteCreator } from './RouteCreator';

export const healthcheck: RouteCreator = (dependencies) =>
	dependencies.expressApp.get('/healthcheck', (req, res) => {
		res.send('Healthy');
	});
