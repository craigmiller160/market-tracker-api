import * as JWT from 'jsonwebtoken';
import { AccessToken } from '../../express/TokenValidation';
import { pipe } from 'fp-ts/function';
import * as Option from 'fp-ts/Option';
import * as Either from 'fp-ts/Either';
import * as Try from '@craigmiller160/ts-functions/Try';
import { UnauthorizedError } from '../../error/UnauthorizedError';

// TODO I want to re-use the same token validation logic that passport uses, rather than have two different operations

const decodeToken = (token: string): Try.Try<AccessToken> =>
	Try.tryCatch(() => JWT.decode(token) as AccessToken);

// TODO consider using flow
export const refreshExpiredToken = (token: string | null) => {
	pipe(
		Option.fromNullable(token),
		Either.fromOption(() => new UnauthorizedError('No token to refresh')),
		Either.chain(decodeToken)
	);
};
