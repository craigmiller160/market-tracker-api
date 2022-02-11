import { NextFunction, Request, Response } from 'express';
import { TaskT, TaskTryT, TryT } from '@craigmiller160/ts-functions/types';
import { getRequiredValues2 } from '../../function/Values';
import { pipe, identity, flow } from 'fp-ts/function';
import * as Either from 'fp-ts/Either';
import * as RNonEmptyArray from 'fp-ts/ReadonlyNonEmptyArray';
import * as TaskEither from 'fp-ts/TaskEither';
import { match, when } from 'ts-pattern';
import qs from 'qs';
import { logAndReturn, logger } from '../../logger';
import * as TaskTry from '@craigmiller160/ts-functions/TaskTry';
import { isAxiosError, restClient } from '../RestClient';
import { AxiosError } from 'axios';
import * as Option from 'fp-ts/Option';
import { CryptoGeckoError } from '../../error/CryptoGeckoError';
import * as Json from '@craigmiller160/ts-functions/Json';

const getCoinGeckoEnv = (): TryT<string> =>
	pipe(
		getRequiredValues2([process.env.COIN_GECKO_BASE_URL]),
		Either.map(RNonEmptyArray.head)
	);

const isNotEmpty = (text: string) => text.length > 0;

const sendCryptoGeckoRequest = (
	baseUrl: string,
	uri: string,
	query: object
): TaskTryT<object> => {
	const queryString = match(qs.stringify(query))
		.with(when(isNotEmpty), (_) => `?${_}`)
		.otherwise(identity);
	const realUri = uri.replace(/^\/cryptogecko/, '');
	const fullCryptoGeckoUrl = `${baseUrl}${realUri}${queryString}`;
	logger.debug(`Sending request to CryptoGecko: ${fullCryptoGeckoUrl}`);
	return pipe(
		TaskTry.tryCatch(() => restClient.get(fullCryptoGeckoUrl)),
		TaskEither.map((_) => _.data),
		TaskEither.map(
			logAndReturn('debug', 'CryptoGecko request completed', true)
		)
	);
};

const buildCryptoGeckoErrorMessage = (ex: AxiosError): string =>
	pipe(
		Option.fromNullable(ex.response),
		Option.bindTo('response'),
		Option.bind('status', ({ response }) => Option.of(response.status)),
		Option.bind(
			'data',
			flow(
				({ response }) => Option.of(response.data),
				Option.fold(() => ({}), identity),
				Json.stringifyO
			)
		),
		Option.map(
			({ status, data }) =>
				`Error calling CoinGecko. Status: ${status} Message: ${data}`
		),
		Option.getOrElse(() => 'Error calling CoinGecko. No data on error.')
	);

const handleCryptoGeckoError =
	(next: NextFunction) =>
	(ex: Error): TaskT<void> => {
		const handledError = match(ex)
			.with(
				when(isAxiosError),
				(_) => new CryptoGeckoError(buildCryptoGeckoErrorMessage(_))
			)
			.otherwise(identity);

		return async () => {
			next(handledError);
		};
	};

const handleCryptoGeckoData =
	(req: Request, res: Response) => (data: object) => async () => {
		res.json(data);
	};

export const queryCoinGecko = (
	req: Request,
	res: Response,
	next: NextFunction
): TaskT<void> =>
	pipe(
		getCoinGeckoEnv(),
		TaskEither.fromEither,
		TaskEither.chain((baseUrl) =>
			sendCryptoGeckoRequest(baseUrl, req.path, req.query)
		),
		TaskEither.fold(
			handleCryptoGeckoError(next),
			handleCryptoGeckoData(req, res)
		)
	);
