import { Request } from 'express';
import { getMarketTrackerSession } from '../../function/HttpRequest';
import * as Option from 'fp-ts/Option';
import * as Either from 'fp-ts/Either';
import { pipe } from 'fp-ts/function';
import * as IOEither from 'fp-ts/IOEither';
import * as TaskEither from 'fp-ts/TaskEither';
import { TokenResponse } from '../../types/TokenResponse';
import * as Try from '@craigmiller160/ts-functions/Try';
import { createTokenCookie } from './Cookie';
import * as Time from '@craigmiller160/ts-functions/Time';
import { STATE_EXP_FORMAT } from './constants';
import { UnauthorizedError } from '../../error/UnauthorizedError';
import { sendTokenRequest } from './AuthServerRequest';
import { getRequiredValues } from '../../function/Values';
import { AppRefreshToken } from '../../data/modelTypes/AppRefreshToken';
import { appRefreshTokenRepository } from '../../data/repo';
import { IOT, TaskTryT, TryT } from '@craigmiller160/ts-functions/types';

export interface AuthCodeSuccess {
	readonly cookie: string;
	readonly postAuthRedirect: string;
}

export interface AuthCodeBody {
	readonly grant_type: string;
	readonly client_id: string;
	readonly code: string;
	readonly redirect_uri: string;
}

interface CodeAndOrigin {
	readonly code: string;
	readonly origin: string;
}

const validateState = (req: Request, providedState: number): TryT<number> => {
	const { state } = getMarketTrackerSession(req);
	return pipe(
		Option.fromNullable(state),
		Either.fromOption(
			() =>
				new UnauthorizedError('Cannot find auth code state in session')
		),
		Either.filterOrElse(
			(_) => _ === providedState,
			() => new UnauthorizedError('Invalid auth code state')
		)
	);
};

const parseAndValidateNotExpired = (stateExpString: string): boolean =>
	pipe(
		stateExpString,
		Time.parse(STATE_EXP_FORMAT),
		Time.compare(new Date())
	) <= 0;

const validateStateExpiration = (req: Request): TryT<string> => {
	const { stateExpiration } = getMarketTrackerSession(req);
	return pipe(
		Option.fromNullable(stateExpiration),
		Either.fromOption(
			() =>
				new UnauthorizedError(
					'Cannot find auth code state expiration in session'
				)
		),
		Either.filterOrElse(
			parseAndValidateNotExpired,
			() => new UnauthorizedError('Auth code state has expired')
		)
	);
};

const getAndValidateOrigin = (req: Request): TryT<string> => {
	const { origin } = getMarketTrackerSession(req);
	return pipe(
		Option.fromNullable(origin),
		Either.fromOption(
			() => new UnauthorizedError('Cannot find origin in session')
		)
	);
};

const removeAuthCodeSessionAttributes =
	(req: Request): IOT<void> =>
	() => {
		const session = getMarketTrackerSession(req);
		delete session.stateExpiration;
		delete session.state;
		delete session.origin;
	};

const handleRefreshToken = (
	tokenResponse: TokenResponse
): TaskTryT<unknown> => {
	const refreshToken: AppRefreshToken = {
		tokenId: tokenResponse.tokenId,
		refreshToken: tokenResponse.refreshToken
	};
	// TODO refactor this
	return appRefreshTokenRepository.saveRefreshToken(refreshToken);
};

const prepareRedirect = (): TryT<string> =>
	pipe(
		Option.fromNullable(process.env.POST_AUTH_REDIRECT),
		Either.fromOption(
			() =>
				new UnauthorizedError(
					'No post-auth redirect available for auth code login'
				)
		)
	);

const getCodeAndState = (req: Request): TryT<[string, number]> => {
	const nullableQueryArray: ReadonlyArray<string | undefined> = [
		req.query.code as string | undefined,
		req.query.state as string | undefined
	];

	return pipe(
		getRequiredValues(nullableQueryArray),
		Either.mapLeft(
			() =>
				new UnauthorizedError(
					`Missing required query params for authentication: ${nullableQueryArray}`
				)
		),
		Either.bindTo('parts'),
		Either.bind('state', ({ parts: [, stateString] }) =>
			Try.tryCatch(() => parseInt(stateString))
		),
		Either.map(({ parts: [code], state }) => [code, state])
	);
};

const getAndValidateCodeOriginAndState = (req: Request): TryT<CodeAndOrigin> =>
	pipe(
		getCodeAndState(req),
		Either.bindTo('codeAndState'),
		Either.chainFirst(({ codeAndState: [, state] }) =>
			validateState(req, state)
		),
		Either.chainFirst(() => validateStateExpiration(req)),
		Either.bind('origin', () => getAndValidateOrigin(req)),
		Either.map(
			({ codeAndState: [code], origin }): CodeAndOrigin => ({
				code,
				origin
			})
		),
		Either.chainFirst(IOEither.fromIO(removeAuthCodeSessionAttributes(req)))
	);

const createAuthCodeBody = (
	origin: string,
	code: string
): TryT<AuthCodeBody> => {
	const envArray: ReadonlyArray<string | undefined> = [
		process.env.CLIENT_KEY,
		process.env.AUTH_CODE_REDIRECT_URI
	];

	return pipe(
		getRequiredValues(envArray),
		Either.map(
			([clientKey, redirectUri]): AuthCodeBody => ({
				grant_type: 'authorization_code',
				client_id: clientKey,
				code: code,
				redirect_uri: `${origin}${redirectUri}`
			})
		)
	);
};

export const authenticateWithAuthCode = (
	req: Request
): TaskTryT<AuthCodeSuccess> =>
	pipe(
		getAndValidateCodeOriginAndState(req),
		Either.chain(({ origin, code }) => createAuthCodeBody(origin, code)),
		TaskEither.fromEither,
		TaskEither.chain(sendTokenRequest),
		TaskEither.chainFirst(handleRefreshToken),
		TaskEither.chain((_) =>
			TaskEither.fromEither(createTokenCookie(_.accessToken))
		),
		TaskEither.bindTo('cookie'),
		TaskEither.bind('postAuthRedirect', () =>
			TaskEither.fromEither(prepareRedirect())
		)
	);
