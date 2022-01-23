import { NextFunction } from 'express';
import { TaskT } from '@craigmiller160/ts-functions/types';
import * as Task from 'fp-ts/Task';

export const errorTask =
	(next: NextFunction) =>
	(ex: Error): TaskT<string> => {
		next(ex);
		return Task.of('');
	};
