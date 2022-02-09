// import './processErrorHandling'; TODO restore this
import { connectToMongo } from './mongo';
import { pipe } from 'fp-ts/function';
import * as TaskEither from 'fp-ts/TaskEither';
import { startExpressServer } from './express';
import { logAndReturn, logger } from './logger';
import { loadTokenKey } from './services/auth/TokenKey';

logger.info('Starting application');

pipe(
	loadTokenKey(),
	TaskEither.chainFirst(connectToMongo),
	TaskEither.chain(startExpressServer),
	TaskEither.mapLeft(logAndReturn('error', 'Error starting application')),
	TaskEither.mapLeft((_) => {
		process.exit(1);
		return _;
	})
)();
