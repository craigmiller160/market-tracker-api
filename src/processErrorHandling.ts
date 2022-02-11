import { logger2 } from './logger';

process.on('uncaughtException', (err) => {
	logger2.error('Uncaught Exception');
	logger2.error(err);
});
