import './processErrorHandling';
import { connectToMongo } from './mongo';
import { pipe } from 'fp-ts/function';
import * as TaskEither from 'fp-ts/TaskEither';
import { startExpressServer } from './express';
import { logger } from './logger';
import * as Process from '@craigmiller160/ts-functions/Process';
import * as Task from 'fp-ts/Task';
import * as IO from 'fp-ts/IO';
import { constVoid } from 'fp-ts/function';
import { getTokenValidationConfig } from './keycloak/getTokenValidationConfig';

pipe(
	logger.info('Starting application'),
	TaskEither.fromIO,
	TaskEither.chain(() => getTokenValidationConfig()),
	TaskEither.chainFirst(connectToMongo),
	TaskEither.chain(startExpressServer),
	TaskEither.fold(
		(ex) =>
			pipe(
				logger.errorWithStack('Error starting application', ex),
				IO.chain(() => Process.exit(1)),
				Task.fromIO
			),
		() => Task.of(constVoid())
	)
)();
