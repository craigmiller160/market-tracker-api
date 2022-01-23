import { OldRouteCreator } from '../../src/express/routes/RouteCreator';
import { Request } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import {
	getMarketTrackerSession,
	MarketTrackerSession
} from '../../src/function/HttpRequest';

export const createSessionRoute: OldRouteCreator = (app) => {
	app.get('/session', (req, res) => {
		const session = getMarketTrackerSession(req);
		res.json({
			state: session.state,
			origin: session.origin,
			stateExpiration: session.stateExpiration
		});
	});

	app.post(
		'/session',
		(
			req: Request<ParamsDictionary, unknown, MarketTrackerSession>,
			res
		) => {
			const session = getMarketTrackerSession(req);
			session.origin = req.body.origin;
			session.stateExpiration = req.body.stateExpiration;
			session.state = req.body.state;
			res.status(204);
			res.end();
		}
	);
};
