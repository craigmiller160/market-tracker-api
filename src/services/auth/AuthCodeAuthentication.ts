import { Request } from 'express';
import { getMarketTrackerSession } from '../../function/HttpRequest';
import * as O from 'fp-ts/Option';
import * as E from 'fp-ts/Either';
import { pipe } from 'fp-ts/function';
import * as IO from 'fp-ts/IO';
import * as IOE from 'fp-ts/IOEither';
import * as TaskTry from '@craigmiller160/ts-functions/TaskTry';
import * as TE from 'fp-ts/TaskEither';
import { restClient } from '../RestClient';
import { TokenResponse } from '../../types/TokenResponse';
import * as A from 'fp-ts/Array';
import * as Try from '@craigmiller160/ts-functions/Try';
import { AppRefreshToken } from '../../mongo/models/AppRefreshTokenModel';
import { saveRefreshToken } from '../mongo/RefreshTokenService';
import { createTokenCookie } from './Cookie';
import * as Time from '@craigmiller160/ts-functions/Time';
import { STATE_EXP_FORMAT } from './constants';
import { UnauthorizedError } from '../../error/UnauthorizedError';
import { logError } from '../../logger';
import qs from 'qs';

export interface AuthCodeSuccess {
	readonly cookie: string;
	readonly postAuthRedirect: string;
}

export interface AuthenticateBody {
	readonly grant_type: string;
	readonly client_id: string;
	readonly code: string;
	readonly redirect_uri: string;
}

interface CodeAndOrigin {
	readonly code: string;
	readonly origin: string;
}

const TOKEN_PATH = '/oauth/token';

const validateState = (
	req: Request,
	providedState: number
): E.Either<Error, number> => {
	const { state } = getMarketTrackerSession(req);
	return pipe(
		O.fromNullable(state),
		E.fromOption(
			() =>
				new UnauthorizedError('Cannot find auth code state in session')
		),
		E.filterOrElse(
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

const validateStateExpiration = (req: Request): E.Either<Error, string> => {
	const { stateExpiration } = getMarketTrackerSession(req);
	return pipe(
		O.fromNullable(stateExpiration),
		E.fromOption(
			() =>
				new UnauthorizedError(
					'Cannot find auth code state expiration in session'
				)
		),
		E.filterOrElse(
			parseAndValidateNotExpired,
			() => new UnauthorizedError('Auth code state has expired')
		)
	);
};

const getAndValidateOrigin = (req: Request): E.Either<Error, string> => {
	const { origin } = getMarketTrackerSession(req);
	return pipe(
		O.fromNullable(origin),
		E.fromOption(
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

const createAuthenticateBody = (
	origin: string,
	code: string,
	envVariables: string[]
): AuthenticateBody => {
	const [clientKey, , authCodeRedirectUri] = envVariables;

	return {
		grant_type: 'authorization_code',
		client_id: clientKey,
		code: code,
		redirect_uri: `${origin}${authCodeRedirectUri}`
	};
};

const sendTokenRequest = (
	requestBody: AuthenticateBody,
	basicAuth: string,
	authServerHost: string
): TE.TaskEither<Error, TokenResponse> =>
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
		TE.map((_) => _.data),
		TE.mapLeft((_) =>
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
): E.Either<Error, string> =>
	Try.tryCatch(() =>
		Buffer.from(`${clientKey}:${clientSecret}`).toString('base64')
	);

const authenticateCode = (
	origin: string,
	code: string
): TE.TaskEither<Error, TokenResponse> => {
	const nullableEnvArray: Array<string | undefined> = [
		process.env.CLIENT_KEY,
		process.env.CLIENT_SECRET,
		process.env.AUTH_CODE_REDIRECT_URI,
		process.env.AUTH_SERVER_HOST
	];

	return pipe(
		nullableEnvArray,
		A.map(O.fromNullable),
		O.sequenceArray,
		O.map((_) => _ as string[]),
		E.fromOption(
			() =>
				new UnauthorizedError(
					`Missing environment variables to authenticate auth code: ${nullableEnvArray}`
				)
		),
		E.bindTo('envVariables'),
		E.bind('requestBody', ({ envVariables }) =>
			E.right(createAuthenticateBody(origin, code, envVariables))
		),
		E.bind('basicAuth', ({ envVariables: [clientKey, clientSecret] }) =>
			createBasicAuth(clientKey, clientSecret)
		),
		TE.fromEither,
		TE.chain(
			({
				requestBody,
				basicAuth,
				envVariables: [, , , authServerHost]
			}) => sendTokenRequest(requestBody, basicAuth, authServerHost)
		)
	);
};

const handleRefreshToken = (
	tokenResponse: TokenResponse
): TE.TaskEither<Error, unknown> => {
	const refreshToken: AppRefreshToken = {
		tokenId: tokenResponse.tokenId,
		refreshToken: tokenResponse.refreshToken
	};
	return saveRefreshToken(refreshToken);
};

const prepareRedirect = (): E.Either<Error, string> =>
	pipe(
		O.fromNullable(process.env.POST_AUTH_REDIRECT),
		E.fromOption(
			() =>
				new UnauthorizedError(
					'No post-auth redirect available for auth code login'
				)
		)
	);

const getCodeAndState = (req: Request): E.Either<Error, [string, number]> => {
	const nullableQueryArray: Array<string | undefined> = [
		req.query.code as string | undefined,
		req.query.state as string | undefined
	];

	return pipe(
		nullableQueryArray,
		A.map(O.fromNullable),
		O.sequenceArray,
		E.fromOption(
			() =>
				new UnauthorizedError(
					`Missing required query params for authentication: ${nullableQueryArray}`
				)
		),
		E.bindTo('parts'),
		E.bind('state', ({ parts: [, stateString] }) =>
			Try.tryCatch(() => parseInt(stateString))
		),
		E.map(({ parts: [code], state }) => [code, state])
	);
};

export const authenticateWithAuthCode = (
	req: Request
): TE.TaskEither<Error, AuthCodeSuccess> =>
	pipe(
		getCodeAndState(req),
		E.bindTo('codeAndState'),
		E.chainFirst(({ codeAndState: [, state] }) =>
			validateState(req, state)
		),
		E.chainFirst(() => validateStateExpiration(req)),
		E.bind('origin', () => getAndValidateOrigin(req)),
		E.map(
			({ codeAndState: [code], origin }): CodeAndOrigin => ({
				code,
				origin
			})
		),
		E.chainFirst(IOE.fromIO(removeAuthCodeSessionAttributes(req))),
		TE.fromEither,
		TE.chain(({ code, origin }) => authenticateCode(origin, code)),
		TE.chainFirst(handleRefreshToken),
		TE.chain((_) => TE.fromEither(createTokenCookie(_.accessToken))),
		TE.bindTo('cookie'),
		TE.bind('postAuthRedirect', () => TE.fromEither(prepareRedirect()))
	);
