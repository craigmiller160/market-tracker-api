import { Request } from 'express';
import { AccessToken } from '../../express/auth/AccessToken';
import { pipe } from 'fp-ts/function';
import * as Option from 'fp-ts/Option';
import { UnauthorizedError } from '../../error/UnauthorizedError';
import { getEmptyCookie } from './Cookie';
import { ReaderTaskTryT } from '@craigmiller160/ts-functions/types';
import { ExpressDependencies } from '../../express/ExpressDependencies';
import * as ReaderTaskEither from 'fp-ts/ReaderTaskEither';

const deleteRefreshToken =
	(token: AccessToken): ReaderTaskTryT<ExpressDependencies, unknown> =>
	({ appRefreshTokenRepository }) =>
		appRefreshTokenRepository.deleteByTokenId(token.jti);

export const logout = (
	req: Request
): ReaderTaskTryT<ExpressDependencies, string> =>
	pipe(
		Option.fromNullable(req.user as AccessToken | undefined),
		ReaderTaskEither.fromOption(
			() =>
				new UnauthorizedError(
					'Should not be able to call /logout without being authenticated'
				)
		),
		ReaderTaskEither.chainFirst(deleteRefreshToken),
		ReaderTaskEither.chain(() =>
			ReaderTaskEither.fromEither(getEmptyCookie())
		)
	);
