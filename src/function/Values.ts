import * as Either from 'fp-ts/Either';
import * as Option from 'fp-ts/Option';
import { flow, pipe } from 'fp-ts/function';
import { MissingValuesError } from '../error/MissingValuesError';
import {
	OptionT,
	ReadonlyNonEmptyArrayT,
	TryT
} from '@craigmiller160/ts-functions/types';
import * as RNonEmptyArray from 'fp-ts/ReadonlyNonEmptyArray';
import * as Json from '@craigmiller160/ts-functions/Json';

export const getRequiredValues = (
	valuesArray: ReadonlyArray<OptionT<string>>
): TryT<ReadonlyArray<string>> =>
	pipe(
		valuesArray,
		Option.sequenceArray,
		Either.fromOption(
			() =>
				new MissingValuesError(
					`Missing required values: ${Option.getOrElse(() => 'Error')(
						Json.stringifyO(valuesArray)
					)}`
				)
		)
	);

// TODO delete this
export const getRequiredValues2 = (
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
