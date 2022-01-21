import { Request } from 'express';
import { getMarketTrackerSession } from '../../function/HttpRequest';
import * as Option from 'fp-ts/Option';
import * as Either from 'fp-ts/Either';
import { pipe } from 'fp-ts/function';
import * as IO from 'fp-ts/IO';
import * as IOEither from 'fp-ts/IOEither';
import * as TaskTry from '@craigmiller160/ts-functions/TaskTry';
import * as TaskEither from 'fp-ts/TaskEither';
import { restClient } from '../RestClient';
import { TokenResponse } from '../../types/TokenResponse';
import * as A from 'fp-ts/Array';
import * as RArray from 'fp-ts/ReadonlyArray';
import * as Try from '@craigmiller160/ts-functions/Try';
import { AppRefreshToken } from '../../mongo/models/AppRefreshTokenModel';
import { saveRefreshToken } from '../mongo/RefreshTokenService';
import { createTokenCookie } from './Cookie';
import * as Time from '@craigmiller160/ts-functions/Time';
import { STATE_EXP_FORMAT } from './constants';
import { UnauthorizedError } from '../../error/UnauthorizedError';
import { logError } from '../../logger';
import qs from 'qs';
import {sendTokenRequest} from './AuthServerRequest';

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

const TOKEN_PATH = '/oauth/token'; // TODO delete this

const validateState = (
	req: Request,
	providedState: number
): Either.Either<Error, number> => {
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

const validateStateExpiration = (
	req: Request
): Either.Either<Error, string> => {
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

const getAndValidateOrigin = (req: Request): Either.Either<Error, string> => {
	const { origin } = getMarketTrackerSession(req);
	return pipe(
		Option.fromNullable(origin),
		Either.fromOption(
			() => new UnauthorizedError('Cannot find origin in session')
		)
	);
};

const removeAuthCodeSessionAttributes =
	(req: Request): IO.IO<void> =>
	() => {
		const session = getMarketTrackerSession(req);
		delete session.stateExpiration;
		delete session.state;
		delete session.origin;
	};

const sendTokenRequest2 = (
	requestBody: AuthCodeBody,
	basicAuth: string,
	authServerHost: string
): TaskEither.TaskEither<Error, TokenResponse> =>
	pipe(
		TaskTry.tryCatch(() =>
			restClient.post<TokenResponse>(
				`${authServerHost}${TOKEN_PATH}`,
				qs.stringify(requestBody),
				{
					headers: {
						'content-type': 'application/x-www-form-urlencoded',
						authorization: `Basic ${basicAuth}`
					}
				}
			)
		),
		TaskEither.map((_) => _.data),
		TaskEither.mapLeft((_) =>
			pipe(
				logError('Auth server returned error response', _),
				IO.map(
					() =>
						new UnauthorizedError(
							'Error authenticating with Auth Server'
						)
				)
			)()
		)
	);

const createBasicAuth = (
	clientKey: string,
	clientSecret: string
): Either.Either<Error, string> =>
	Try.tryCatch(() =>
		Buffer.from(`${clientKey}:${clientSecret}`).toString('base64')
	);

const authenticateCode = (
	origin: string,
	code: string
): TaskEither.TaskEither<Error, TokenResponse> => {
	const nullableEnvArray: Array<string | undefined> = [
		process.env.CLIENT_KEY,
		process.env.CLIENT_SECRET,
		process.env.AUTH_CODE_REDIRECT_URI,
		process.env.AUTH_SERVER_HOST
	];

	return pipe(
		nullableEnvArray,
		A.map(Option.fromNullable),
		Option.sequenceArray,
		Option.map((_) => _ as string[]),
		Either.fromOption(
			() =>
				new UnauthorizedError(
					`Missing environment variables to authenticate auth code: ${nullableEnvArray}`
				)
		),
		Either.bindTo('envVariables'),
		Either.bind('requestBody', ({ envVariables }) =>
			Either.right(createAuthenticateBody2(origin, code, envVariables))
		),
		Either.bind(
			'basicAuth',
			({ envVariables: [clientKey, clientSecret] }) =>
				createBasicAuth(clientKey, clientSecret)
		),
		TaskEither.fromEither,
		TaskEither.chain(
			({
				requestBody,
				basicAuth,
				envVariables: [, , , authServerHost]
			}) => sendTokenRequest2(requestBody, basicAuth, authServerHost)
		)
	);
};

const handleRefreshToken = (
	tokenResponse: TokenResponse
): TaskEither.TaskEither<Error, unknown> => {
	const refreshToken: AppRefreshToken = {
		tokenId: tokenResponse.tokenId,
		refreshToken: tokenResponse.refreshToken
	};
	return saveRefreshToken(refreshToken);
};

const prepareRedirect = (): Either.Either<Error, string> =>
	pipe(
		Option.fromNullable(process.env.POST_AUTH_REDIRECT),
		Either.fromOption(
			() =>
				new UnauthorizedError(
					'No post-auth redirect available for auth code login'
				)
		)
	);

const getCodeAndState = (
	req: Request
): Either.Either<Error, [string, number]> => {
	const nullableQueryArray: Array<string | undefined> = [
		req.query.code as string | undefined,
		req.query.state as string | undefined
	];

	return pipe(
		nullableQueryArray,
		A.map(Option.fromNullable),
		Option.sequenceArray,
		Either.fromOption(
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

const getAndValidateCodeOriginAndState = (
	req: Request
): Try.Try<CodeAndOrigin> =>
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

const createAuthenticateBody2 = (
	origin: string,
	code: string,
	envVariables: string[]
): AuthCodeBody => {
	const [clientKey, , authCodeRedirectUri] = envVariables;

	return {
		grant_type: 'authorization_code',
		client_id: clientKey,
		code: code,
		redirect_uri: `${origin}${authCodeRedirectUri}`
	};
};

const createAuthCodeBody = (
	origin: string,
	code: string
): Try.Try<AuthCodeBody> => {
	const envArray: ReadonlyArray<string | undefined> = [
		process.env.CLIENT_KEY,
		process.env.AUTH_CODE_REDIRECT_URI
	];

	return pipe(
		envArray,
		RArray.map(Option.fromNullable),
		Option.sequenceArray,
		Either.fromOption(
			() =>
				new UnauthorizedError(
					'Missing environment variables for auth code request'
				)
		),
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
): TaskTry.TaskTry<AuthCodeSuccess> => {
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
		Either.chainFirst(
			IOEither.fromIO(removeAuthCodeSessionAttributes(req))
		),
		TaskEither.fromEither,
		TaskEither.chain(({ code, origin }) => authenticateCode(origin, code)),
		TaskEither.chainFirst(handleRefreshToken),
		TaskEither.chain((_) =>
			TaskEither.fromEither(createTokenCookie(_.accessToken))
		),
		TaskEither.bindTo('cookie'),
		TaskEither.bind('postAuthRedirect', () =>
			TaskEither.fromEither(prepareRedirect())
		)
	);

	pipe(
		getAndValidateCodeOriginAndState(req),
		Either.chain(({ origin, code }) => createAuthCodeBody(origin, code)),
		TaskEither.fromEither,
		TaskEither.chain(sendTokenRequest)
	);

	throw new Error();
};
