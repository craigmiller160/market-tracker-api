import * as Either from 'fp-ts/Either';
import * as RNonEmptyArray from 'fp-ts/ReadonlyNonEmptyArray';
import { match } from 'ts-pattern';
import * as Apply from 'fp-ts/Apply';
import { ReadonlyNonEmptyArrayT } from '@craigmiller160/ts-functions/types';
import { pipe } from 'fp-ts/function';

const validation = Either.getApplicativeValidation(
	RNonEmptyArray.getSemigroup<Error>()
);

interface Person {
	readonly firstName: string;
	readonly lastName: string;
}

const validateFirstName = (person: Person): Either.Either<Error, Person> =>
	match(person)
		.with({ firstName: 'Bob' }, () => Either.right(person))
		.otherwise(() => Either.left(new Error('Invalid first name')));

const validateLastName = (person: Person): Either.Either<Error, Person> =>
	match(person)
		.with({ lastName: 'Saget' }, () => Either.right(person))
		.otherwise(() => Either.left(new Error('Invalid last name')));

const bob: Person = {
	firstName: 'Bob',
	lastName: 'Saget'
};

function lift<E, A>(
	check: (a: A) => Either.Either<E, A>
): (a: A) => Either.Either<ReadonlyNonEmptyArrayT<E>, A> {
	return (a) =>
		pipe(
			check(a),
			Either.mapLeft((a) => [a])
		);
}

const validateFirstNameV: Either.Either<
	ReadonlyNonEmptyArrayT<Error>,
	Person
> = lift(validateFirstName);

const validateLastNameV: Either.Either<
	ReadonlyNonEmptyArrayT<Error>,
	Person
> = lift(validateLastName);

const result: Either.Either<
	ReadonlyNonEmptyArrayT<Error>,
	Person[]
> = Apply.sequenceT(validation)([validateFirstNameV(bob), validateLastNameV(bob)]);

const foo = Apply.sequenceT(validation);
