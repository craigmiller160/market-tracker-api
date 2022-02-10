import { NextFunction, Request, Response } from 'express';
import { TaskT, TryT } from '@craigmiller160/ts-functions/types';
import { getRequiredValues } from '../../function/Values';
import { pipe } from 'fp-ts/function';
import * as Either from 'fp-ts/Either';
import * as RNonEmptyArray from 'fp-ts/ReadonlyNonEmptyArray';

const getCoinGeckoEnv = (): TryT<string> =>
	pipe(
		getRequiredValues([process.env.COIN_GECKO_BASE_URL]),
		Either.map((a) => RNonEmptyArray.head(a))
	);

export const queryCoinGecko = (
	req: Request,
	res: Response,
	next: NextFunction
): TaskT<void> => {
	getCoinGeckoEnv();
	throw new Error(`${req} ${res} ${next()}`);
};
