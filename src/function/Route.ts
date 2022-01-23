import { NextFunction } from 'express';
import { ReaderTaskT, TaskT } from '@craigmiller160/ts-functions/types';
import * as Task from 'fp-ts/Task';
import * as ReaderTask from 'fp-ts/ReaderTask';

export const errorTask =
	(next: NextFunction) =>
	(ex: Error): TaskT<string> => {
		next(ex);
		return Task.of('');
	};

export const errorReaderTask =
	<T>(next: NextFunction) =>
	(ex: Error): ReaderTaskT<T, string> => {
		next(ex);
		return ReaderTask.of('');
	};
