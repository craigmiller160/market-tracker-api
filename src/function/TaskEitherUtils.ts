import * as TE from 'fp-ts/TaskEither';
import * as T from 'fp-ts/Task';
import { unknownToError } from './unknownToError';
import { pipe } from 'fp-ts/function';

export const tryCatch = <T>(fn: () => Promise<T>): TE.TaskEither<Error, T> =>
	TE.tryCatch(fn, unknownToError);

export type TaskEither<T> = TE.TaskEither<Error, T>;

export const throwIfLeft = <V>(te: TaskEither<V>): T.Task<V> =>
	pipe(
		te,
		TE.fold((_) => {
			throw _;
		}, T.of)
	);
