import * as Either from 'fp-ts/Either';
import * as RArray from 'fp-ts/ReadonlyArray';
import * as Option from 'fp-ts/Option';
import * as Try from '@craigmiller160/ts-functions/Try';
import { pipe } from 'fp-ts/function';
import { MissingValuesError } from '../error/MissingValuesError';

export const getRequiredValues = (
	valuesArray: ReadonlyArray<string | undefined>
): Try.Try<ReadonlyArray<string>> =>
	pipe(
		valuesArray,
		RArray.map(Option.fromNullable),
		Option.sequenceArray,
		Either.fromOption(
			() =>
				new MissingValuesError(
					`Missing required environment variables: ${valuesArray}`
				)
		)
	);
