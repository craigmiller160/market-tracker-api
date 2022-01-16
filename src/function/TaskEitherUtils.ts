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
		TE.fold(
			(_) => {
				throw _;
			},
			(_) => T.of(_)
		)
	);

export function multiTypeSequence<A>(a: TaskEither<A>): TaskEither<[A]>;
export function multiTypeSequence<A, B>(
	a: TaskEither<A>,
	b: TaskEither<B>
): TaskEither<[A, B]>;
export function multiTypeSequence<A, B, C>(
	a: TaskEither<A>,
	b: TaskEither<B>,
	c: TaskEither<C>
): TaskEither<[A, B, C]>;
export function multiTypeSequence<A, B, C, D>(
	a: TaskEither<A>,
	b: TaskEither<B>,
	c: TaskEither<C>,
	d: TaskEither<D>
): TaskEither<[A, B, C, D]>;
export function multiTypeSequence<A, B, C, D, E>(
	a: TaskEither<A>,
	b: TaskEither<B>,
	c: TaskEither<C>,
	d: TaskEither<D>,
	e: TaskEither<E>
): TaskEither<[A, B, C, D, E]>;
export function multiTypeSequence<A, B, C, D, E, F>(
	a: TaskEither<A>,
	b: TaskEither<B>,
	c: TaskEither<C>,
	d: TaskEither<D>,
	e: TaskEither<E>,
	f: TaskEither<F>
): TaskEither<[A, B, C, D, E, F]>;
export function multiTypeSequence<A, B, C, D, E, F, G>(
	a: TaskEither<A>,
	b: TaskEither<B>,
	c: TaskEither<C>,
	d: TaskEither<D>,
	e: TaskEither<E>,
	f: TaskEither<F>,
	g: TaskEither<G>
): TaskEither<[A, B, C, D, E, F, G]>;
export function multiTypeSequence<A, B, C, D, E, F, G>(
	a: TaskEither<A>,
	b?: TaskEither<B>,
	c?: TaskEither<C>,
	d?: TaskEither<D>,
	e?: TaskEither<E>,
	f?: TaskEither<F>,
	g?: TaskEither<G>
): TaskEither<unknown> {
	return pipe(
		a,
		TE.bindTo('a'),
		TE.bind('b', () => b ?? TE.of(null)),
		TE.bind('c', () => c ?? TE.of(null)),
		TE.bind('d', () => d ?? TE.of(null)),
		TE.bind('e', () => e ?? TE.of(null)),
		TE.bind('f', () => f ?? TE.of(null)),
		TE.bind('g', () => g ?? TE.of(null)),
		TE.map(({ a, b, c, d, e, f, g }) =>
			[a, b, c, d, e, f, g].filter((_) => !!_)
		)
	);
}
