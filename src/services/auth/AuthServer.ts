import * as RArray from 'fp-ts/ReadonlyArray';
import * as Option from 'fp-ts/Option';
import * as Either from 'fp-ts/Either';
import { pipe } from 'fp-ts/function';
import { UnauthorizedError } from '../../error/UnauthorizedError';

const createBasicAuth = () => {
	const envArray: ReadonlyArray<string | undefined> = [
		process.env.CLIENT_KEY,
		process.env.CLIENT_SECRET
	];

	pipe(
		envArray,
		RArray.map(Option.fromNullable),
		Option.sequenceArray,
		Either.fromOption(
			() =>
				new UnauthorizedError(
					`Missing environment variables for Basic Auth: ${envArray}`
				)
		)
	);
};
