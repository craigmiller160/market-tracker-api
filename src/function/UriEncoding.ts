import * as E from 'fp-ts/Either';
import * as EU from './EitherUtils';

export const encodeForUri = (
	part: string | number | boolean
): E.Either<Error, string> => EU.tryCatch(() => encodeURIComponent(part));
