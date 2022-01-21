import { Request } from 'express';
import { getMarketTrackerSession } from '../../function/HttpRequest';
import * as O from 'fp-ts/Option';
import * as Either from 'fp-ts/Either';
import { pipe } from 'fp-ts/function';
import * as IO from 'fp-ts/IO';
import * as IOEither from 'fp-ts/IOEither';
import * as TaskTry from '@craigmiller160/ts-functions/TaskTry';
import * as TaskEither from 'fp-ts/TaskEither';
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

const TOKEN_PATH = '/oauth/token'; // TODO delete this

const validateState = (
	req: Request,
	providedState: number
): Either.Either<Error, number> => {
	const { state } = getMarketTrackerSession(req);
	return pipe(
		O.fromNullable(state),
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
		O.fromNullable(stateExpiration),
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
		O.fromNullable(origin),
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
		A.map(O.fromNullable),
		O.sequenceArray,
		O.map((_) => _ as string[]),
		Either.fromOption(
			() =>
				new UnauthorizedError(
					`Missing environment variables to authenticate auth code: ${nullableEnvArray}`
				)
		),
		Either.bindTo('envVariables'),
		Either.bind('requestBody', ({ envVariables }) =>
			Either.right(createAuthenticateBody(origin, code, envVariables))
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
			}) => sendTokenRequest(requestBody, basicAuth, authServerHost)
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
		O.fromNullable(process.env.POST_AUTH_REDIRECT),
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
		A.map(O.fromNullable),
		O.sequenceArray,
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

	pipe(getCodeAndState(req), Either.bindTo('CodeAndState'));

	throw new Error();
};
