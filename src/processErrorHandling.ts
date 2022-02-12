import { logger } from './logger';

process.on('uncaughtException', (err) => {
	logger.errorWithStack('Uncaught Exception', err)();
});
