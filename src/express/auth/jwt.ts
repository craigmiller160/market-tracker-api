import { Request } from 'express';
import * as Option from 'fp-ts/Option';
import { pipe } from 'fp-ts/function';
import { ExtractJwt, JwtFromRequestFunction } from 'passport-jwt';
import * as Pred from 'fp-ts/Predicate';

export const isJwtInCookie: Pred.Predicate<Request> = (req) =>
	pipe(
		Option.fromNullable(process.env.COOKIE_NAME),
		Option.chain((_) => Option.fromNullable(req.cookies[_])),
		Option.isSome
	);

const getJwtFromCookie = (req: Request): Option.Option<string> =>
	pipe(
		Option.fromNullable(process.env.COOKIE_NAME),
		Option.chain((_) => Option.fromNullable(req.cookies[_]))
	);

export const jwtFromRequest: JwtFromRequestFunction = (req) =>
	pipe(
		getJwtFromCookie(req),
		Option.getOrElse(() => ExtractJwt.fromAuthHeaderAsBearerToken()(req))
	);
