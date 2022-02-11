import { logger } from './logger';

process.on('uncaughtException', (err) => {
	logger.error('Uncaught Exception');
	logger.error(err);
});
