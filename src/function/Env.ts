import * as Either from 'fp-ts/Either';
import * as RArray from 'fp-ts/ReadonlyArray';
import * as Option from 'fp-ts/Option';
import * as Try from '@craigmiller160/ts-functions/Try';
import { pipe } from 'fp-ts/function';
import { MissingEnvError } from '../error/MissingEnvError';

export const getRequiredEnv = (
	envArray: ReadonlyArray<string | undefined>
): Try.Try<ReadonlyArray<string>> =>
	pipe(
		envArray,
		RArray.map(Option.fromNullable),
		Option.sequenceArray,
		Either.fromOption(
			() =>
				new MissingEnvError(
					`Missing required environment variables: ${envArray}`
				)
		)
	);
