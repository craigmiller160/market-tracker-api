import * as E from 'fp-ts/Either';

export type Either<T> = E.Either<Error, T>;
