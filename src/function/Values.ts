import * as Either from 'fp-ts/Either';
import * as Option from 'fp-ts/Option';
import { pipe } from 'fp-ts/function';
import { MissingValuesError } from '../error/MissingValuesError';
import { OptionT, TryT } from '@craigmiller160/ts-functions/types';
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
