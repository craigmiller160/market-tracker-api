import { Request } from 'express';
import * as O from 'fp-ts/Option';
import { pipe } from 'fp-ts/function';
import * as EU from './EitherUtils';

export interface MarketTrackerSession {
	state?: number;
	origin?: string;
	stateExpiration?: string;
}

export const getHeader = (req: Request, key: string): O.Option<string> =>
	pipe(
		EU.tryCatch(() => O.fromNullable(req.header(key))),
		O.fromEither,
		O.flatten
	);

export const getMarketTrackerSession = (req: Request): MarketTrackerSession =>
	req.session as unknown as MarketTrackerSession;
