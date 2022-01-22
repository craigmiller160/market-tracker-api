import './processErrorHandling';
import { connectToMongo } from './mongo';
import { pipe } from 'fp-ts/function';
import * as TE from 'fp-ts/TaskEither';
import { startExpressServer } from './express';
import { logger } from './logger';
import { loadTokenKey } from './services/auth/TokenKey';

logger.info('Starting application');

pipe(
	loadTokenKey(),
	TE.chainFirst(connectToMongo),
	TE.chain(startExpressServer),
	TE.mapLeft((_) => {
		logger.error('Error starting application');
		logger.error(_);
		process.exit(1);
		return _;
	})
)();
