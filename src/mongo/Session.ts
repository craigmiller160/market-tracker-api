import { ClientSession } from 'mongoose';
import { TaskT, TaskTryT } from '@craigmiller160/ts-functions/types';
import { constVoid, pipe } from 'fp-ts/function';
import * as TaskTry from '@craigmiller160/ts-functions/TaskTry';
import * as TaskEither from 'fp-ts/TaskEither';
import { logger } from '../logger';
import * as Task from 'fp-ts/Task';
import * as Either from 'fp-ts/Either';

export const closeSession = (session: ClientSession): TaskT<void> =>
	pipe(
		TaskTry.tryCatch(() => session.endSession()),
		TaskEither.fold(
			(ex) =>
				pipe(
					logger.errorWithStack('Error closing session', ex),
					Task.fromIO
				),
			() => async () => constVoid()
		)
	);

export const closeSessionAfterTransaction = (
	session: ClientSession
): ((te: TaskTryT<void>) => TaskTryT<void>) =>
	TaskEither.fold(
		(ex) =>
			pipe(
				closeSession(session),
				Task.map(() => Either.left(ex))
			),
		() =>
			pipe(
				closeSession(session),
				Task.map(() => Either.right(constVoid()))
			)
	);
