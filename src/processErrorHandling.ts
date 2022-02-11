import { logger } from './logger';

// TODO how to deal with this?
process.on('uncaughtException', (err) => {
	logger.error('Uncaught Exception');
	logger.error(err);
});
