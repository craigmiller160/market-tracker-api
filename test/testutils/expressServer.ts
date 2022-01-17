import { Server } from 'http';
import * as TaskTry from '@craigmiller160/ts-functions/TaskTry';
import { pipe } from 'fp-ts/function';
import * as O from 'fp-ts/Option';

export const stopExpressServer = (server: Server): TaskTry.TaskTry<string> =>
	TaskTry.tryCatch(
		() =>
			new Promise((resolve, reject) => {
				server.close((err?: Error) => {
					pipe(
						O.fromNullable(err),
						O.fold(
							() => resolve('Express server stopped'),
							(error) => reject(error)
						)
					);
				});
			})
	);
