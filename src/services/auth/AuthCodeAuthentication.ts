import { Request } from 'express';
import { getMarketTrackerSession } from '../../function/HttpRequest';
import * as Option from 'fp-ts/Option';
import * as Either from 'fp-ts/Either';
import { flow, pipe } from 'fp-ts/function';
import { TokenResponse } from '../../types/TokenResponse';
import * as Try from '@craigmiller160/ts-functions/Try';
import { createTokenCookie } from './Cookie';
import * as Time from '@craigmiller160/ts-functions/Time';
import { STATE_EXP_FORMAT } from './constants';
import { UnauthorizedError } from '../../error/UnauthorizedError';
import { sendTokenRequest } from './AuthServerRequest';
import { getRequiredValues } from '../../function/Values';
import { AppRefreshToken } from '../../data/modelTypes/AppRefreshToken';
import {
	IOT,
	IOTryT,
	OptionT,
	ReaderTaskTryT,
	TryT
} from '@craigmiller160/ts-functions/types';
import { ExpressDependencies } from '../../express/ExpressDependencies';
import * as ReaderTaskEither from 'fp-ts/ReaderTaskEither';
import * as Process from '@craigmiller160/ts-functions/Process';
import * as IO from 'fp-ts/IO';
import * as IOEither from 'fp-ts/IOEither';

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

const handleRefreshToken =
	(
		tokenResponse: TokenResponse
	): ReaderTaskTryT<ExpressDependencies, unknown> =>
	({ appRefreshTokenRepository }) => {
		const refreshToken: AppRefreshToken = {
			tokenId: tokenResponse.tokenId,
			refreshToken: tokenResponse.refreshToken
		};
		return appRefreshTokenRepository.saveRefreshToken(refreshToken);
	};

const getCodeAndState = (req: Request): TryT<[string, number]> => {
	const nullableQueryArray: ReadonlyArray<OptionT<string>> = [
		Option.fromNullable(req.query.code as string | undefined),
		Option.fromNullable(req.query.state as string | undefined)
	];

	return pipe(
		getRequiredValues(nullableQueryArray),
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
): IOTryT<AuthCodeBody> => {
	const envArray: ReadonlyArray<IOT<OptionT<string>>> = [
		Process.envLookupO('CLIENT_KEY'),
		Process.envLookupO('AUTH_CODE_REDIRECT_URI')
	];

	return pipe(
		IO.sequenceArray(envArray),
		IO.map(getRequiredValues),
		IOEither.map(
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
): ReaderTaskTryT<ExpressDependencies, AuthCodeSuccess> =>
	pipe(
		getAndValidateCodeOriginAndState(req),
		IOEither.fromEither,
		IOEither.chain(({ origin, code }) => createAuthCodeBody(origin, code)),
		ReaderTaskEither.fromIOEither,
		ReaderTaskEither.chain(
			flow(sendTokenRequest, ReaderTaskEither.fromTaskEither)
		),
		ReaderTaskEither.chainFirst(handleRefreshToken),
		ReaderTaskEither.chain((_) =>
			ReaderTaskEither.fromIOEither(createTokenCookie(_.accessToken))
		),
		ReaderTaskEither.bindTo('cookie'),
		ReaderTaskEither.bind('postAuthRedirect', () =>
			ReaderTaskEither.fromIOEither(
				Process.envLookupE('POST_AUTH_REDIRECT')
			)
		)
	);
