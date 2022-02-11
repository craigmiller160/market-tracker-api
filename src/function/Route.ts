import { NextFunction } from 'express';
import { ReaderTaskT, TaskT } from '@craigmiller160/ts-functions/types';

export const errorTask =
	(next: NextFunction) =>
	(ex: Error): TaskT<void> =>
	async () => {
		next(ex);
	};

export const errorReaderTask =
	<T>(next: NextFunction) =>
	(ex: Error): ReaderTaskT<T, void> =>
	() =>
	async () => {
		next(ex);
	};
