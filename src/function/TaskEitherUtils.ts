import * as TE from 'fp-ts/TaskEither';

export type TaskEither<T> = TE.TaskEither<Error, T>;
