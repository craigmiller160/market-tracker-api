import qs from 'qs';
import { logger } from '../logger';
import { ReaderT } from '@craigmiller160/ts-functions/types';
import { ExpressDependencies } from './ExpressDependencies';

export const setupRequestLogging: ReaderT<ExpressDependencies, void> = (
	dependencies
) => {
	dependencies.expressApp.use((req, res, next) => {
		const queryString = qs.stringify(req.query);
		const fullQueryString = queryString.length > 0 ? `?${queryString}` : '';
		logger.debug(`${req.method} ${req.path}${fullQueryString}`)();
		next();
		res.on('finish', () => {
			logger.info(
				`${req.method} ${req.path}${fullQueryString} - ${res.statusCode}`
			)();
		});
	});
};
