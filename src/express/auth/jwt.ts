import { Request } from 'express';
import * as Option from 'fp-ts/Option';
import { pipe } from 'fp-ts/function';
import { ExtractJwt, JwtFromRequestFunction } from 'passport-jwt';
import { PredicateT, OptionT } from '@craigmiller160/ts-functions/types';
import * as Process from '@craigmiller160/ts-functions/Process';
import * as IO from 'fp-ts/IO';

export const isJwtInCookie: PredicateT<Request> = (req) =>
	pipe(
		Process.envLookupO('COOKIE_NAME'),
		IO.map(Option.chain((_) => Option.fromNullable(req.cookies[_]))),
		IO.map(Option.isSome)
	)();

const getJwtFromCookie = (req: Request): OptionT<string> =>
	pipe(
		Process.envLookupO('COOKIE_NAME'),
		IO.map(Option.chain((_) => Option.fromNullable(req.cookies[_])))
	)();

export const jwtFromRequest: JwtFromRequestFunction = (req) =>
	pipe(
		getJwtFromCookie(req),
		Option.getOrElse(() => ExtractJwt.fromAuthHeaderAsBearerToken()(req))
	);
