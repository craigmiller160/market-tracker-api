import * as Either from 'fp-ts/Either';
import * as Option from 'fp-ts/Option';
import { flow, pipe } from 'fp-ts/function';
import { MissingValuesError } from '../error/MissingValuesError';
import {
	ReadonlyNonEmptyArrayT,
	TryT
} from '@craigmiller160/ts-functions/types';
import * as RNonEmptyArray from 'fp-ts/ReadonlyNonEmptyArray';

export const getRequiredValues = (
	valuesArray: ReadonlyArray<string | undefined>
): TryT<ReadonlyNonEmptyArrayT<string>> =>
	pipe(
		RNonEmptyArray.fromReadonlyArray(valuesArray),
		Either.fromOption(
			() => new MissingValuesError('No required values provided to get')
		),
		Either.chain(
			flow(
				RNonEmptyArray.map(Option.fromNullable),
				Option.sequenceArray,
				Option.chain(RNonEmptyArray.fromReadonlyArray),
				Either.fromOption(
					() =>
						new MissingValuesError(
							`Missing required environment variables: ${valuesArray}`
						)
				)
			)
		)
	);
