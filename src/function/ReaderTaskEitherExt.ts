import { ReaderTaskEither } from 'fp-ts/ReaderTaskEither';
import { ReaderTaskEitherT } from '@craigmiller160/ts-functions/types';
import { Error } from 'mongoose';

export const widen =
	<R1, R2, E, T>(fn: (r1: R1) => R2) =>
	(rte: ReaderTaskEitherT<R1, E, T>): ReaderTaskEitherT<R2, E, T> => (r1: R1) => {
        const r2: R2 = fn(r1);
        // TODO what to do now?
    }
