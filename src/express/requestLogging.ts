import { Express } from 'express';
import qs from 'qs';
import { logger } from '../logger';

export const setupRequestLogging = (app: Express) => {
	app.use((req, res, next) => {
		const queryString = qs.stringify(req.query);
		const fullQueryString = queryString.length > 0 ? `?${queryString}` : '';
		logger.debug(`${req.method} ${req.path}${fullQueryString}`);
		next();
		res.on('finish', () => {
			logger.info(
				`${req.method} ${req.path}${fullQueryString} - ${res.statusCode}`
			);
		});
	});
};
