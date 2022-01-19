import {
	Strategy as JwtStrategy,
	ExtractJwt,
	StrategyOptions,
	JwtFromRequestFunction
} from 'passport-jwt';
import { TokenKey } from '../auth/TokenKey';
import passport from 'passport';
import { logger } from '../logger';
import { NextFunction, Request, Response } from 'express';
import { expressErrorHandler } from './expressErrorHandler';
import { pipe } from 'fp-ts/function';
import * as Option from 'fp-ts/Option';
import * as Try from '@craigmiller160/ts-functions/Try';
import * as Either from 'fp-ts/Either';
import * as RArr from 'fp-ts/ReadonlyArray';
import { UnauthorizedError } from '../error/UnauthorizedError';
import * as Pred from 'fp-ts/Predicate';
import { match } from 'ts-pattern';

export interface AccessToken {
	readonly sub: string;
	readonly clientName: string;
	readonly clientKey: string;
	readonly firstName: string;
	readonly lastName: string;
	readonly userId: number;
	readonly userEmail: string;
	readonly roles: string[];
	readonly jti: string;
}

interface ClientKeyName {
	readonly clientKey: string;
	readonly clientName: string;
}

type Route = (req: Request, res: Response, next: NextFunction) => void;

const secureCallback =
	(req: Request, res: Response, next: NextFunction, fn: Route) =>
	(
		error: Error | null,
		user: AccessToken | boolean,
		tokenError: Error | undefined
	) => {
		pipe(
			Option.fromNullable(error),
			Option.getOrElse(() => tokenError),
			Option.fromNullable,
			Option.fold(
				() => {
					req.user = user as AccessToken;
					fn(req, res, next);
				},
				(realError) => handleTokenError(realError, req, res, next)
			)
		);
	};

const handleTokenError = (
	error: Error,
	req: Request,
	res: Response,
	next: NextFunction
): void =>
	match(error)
		.with({ name: 'TokenExpiredError' }, () => {
			// TODO figure this out
			throw new Error('Figure this out');
		})
		.otherwise(() => expressErrorHandler(error, req, res, next));

export const secure =
	(fn: Route): Route =>
	(req, res, next) => {
		passport.authenticate(
			'jwt',
			{ session: false },
			secureCallback(req, res, next, fn)
		)(req, res, next);
	};

const getJwtFromCookie = (req: Request): Option.Option<string> =>
	pipe(
		Option.fromNullable(process.env.COOKIE_NAME),
		Option.chain((_) => Option.fromNullable(req.cookies[_]))
	);

const jwtFromRequest: JwtFromRequestFunction = (req) =>
	pipe(
		getJwtFromCookie(req),
		Option.getOrElse(() => ExtractJwt.fromAuthHeaderAsBearerToken()(req))
	);

const getClientKeyAndName = (): Try.Try<ClientKeyName> => {
	const envArray: ReadonlyArray<string | undefined> = [
		process.env.CLIENT_KEY,
		process.env.CLIENT_NAME
	];

	return pipe(
		envArray,
		RArr.map(Option.fromNullable),
		Option.sequenceArray,
		Option.map(
			([clientKey, clientName]): ClientKeyName => ({
				clientKey,
				clientName
			})
		),
		Either.fromOption(
			() =>
				new UnauthorizedError(
					`Missing required environment variables for token property validation: ${envArray}`
				)
		)
	);
};

const validatePayload = (token: AccessToken): Pred.Predicate<ClientKeyName> =>
	pipe(
		(keyAndName: ClientKeyName) => keyAndName.clientKey === token.clientKey,
		Pred.and((keyAndName) => keyAndName.clientName === token.clientName)
	);

export const createPassportValidation = (tokenKey: TokenKey) => {
	logger.debug('Creating passport JWT validation strategy');
	const options: StrategyOptions = {
		secretOrKey: tokenKey.key,
		jwtFromRequest
	};

	passport.use(
		new JwtStrategy(options, (payload: AccessToken, done) => {
			const doValidatePayload = validatePayload(payload);
			pipe(
				getClientKeyAndName(),
				Either.filterOrElse<ClientKeyName, Error>(
					doValidatePayload,
					() =>
						new UnauthorizedError(
							'Invalid token payload attributes'
						)
				),
				Either.fold(
					(ex) => done(ex, null),
					() => done(null, payload)
				)
			);
		})
	);
};
