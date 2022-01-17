import * as E from 'fp-ts/Either';
import { pipe } from 'fp-ts/function';

export type Either<T> = E.Either<Error, T>;

// TODO replace with version from craig-build
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
