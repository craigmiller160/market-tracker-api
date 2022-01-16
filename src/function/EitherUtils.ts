import * as E from 'fp-ts/Either';
import { unknownToError } from './unknownToError';
import { pipe } from 'fp-ts/function';

export const tryCatch = <T>(fn: () => T): Either<T> =>
	E.tryCatch(fn, unknownToError);

export type Either<T> = E.Either<Error, T>;

export const throwIfLeft = <T>(e: Either<T>): T =>
	pipe(
		e,
		E.fold(
			(_) => {
				throw _;
			},
			(_) => _
		)
	);
