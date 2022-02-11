import './processErrorHandling';
import { connectToMongo } from './mongo';
import { pipe } from 'fp-ts/function';
import * as TaskEither from 'fp-ts/TaskEither';
import { startExpressServer } from './express';
import { logAndReturn, logger } from './logger';
import { loadTokenKey } from './services/auth/TokenKey';
import * as Process from '@craigmiller160/ts-functions/Process';
import * as Task from 'fp-ts/Task';

logger.info('Starting application');

pipe(
	loadTokenKey(),
	TaskEither.chainFirst(connectToMongo),
	TaskEither.chain(startExpressServer),
	TaskEither.mapLeft(logAndReturn('error', 'Error starting application')),
	TaskEither.fold(
		() => Task.fromIO(Process.exit(1)),
		() => async () => ''
	)
)();
