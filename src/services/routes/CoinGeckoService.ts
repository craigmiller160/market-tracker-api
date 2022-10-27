import { NextFunction, Request, Response } from 'express';
import { IOTryT, TaskT, TaskTryT } from '@craigmiller160/ts-functions/types';
import { getRequiredValues } from '../../function/Values';
import { pipe, identity, flow } from 'fp-ts/function';
import * as TaskEither from 'fp-ts/TaskEither';
import { match, when } from 'ts-pattern';
import qs from 'qs';
import { logger } from '../../logger';
import * as TaskTry from '@craigmiller160/ts-functions/TaskTry';
import { isAxiosError, restClient } from '../RestClient';
import { AxiosError } from 'axios';
import * as Option from 'fp-ts/Option';
import { CryptoGeckoError } from '../../error/CryptoGeckoError';
import * as Json from '@craigmiller160/ts-functions/Json';
import * as Process from '@craigmiller160/ts-functions/Process';
import * as IO from 'fp-ts/IO';
import * as IOEither from 'fp-ts/IOEither';
import * as RArray from 'fp-ts/ReadonlyArray';

const getCoinGeckoEnv = (): IOTryT<string> =>
	pipe(
		IO.sequenceArray([Process.envLookupO('COIN_GECKO_BASE_URL')]),
		IO.map(getRequiredValues),
		IOEither.chain(
			flow(
				RArray.head,
				IOEither.fromOption(
					() => new Error('Cannot find CoinGecko env')
				)
			)
		)
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
	const fullCoinGeckoUrl = `${baseUrl}${realUri}${queryString}`;
	return pipe(
		logger.debug(`Sending request to CoinGecko: ${fullCoinGeckoUrl}`),
		TaskEither.rightIO,
		TaskEither.chain(() =>
			TaskTry.tryCatch(() => restClient.get(fullCoinGeckoUrl))
		),
		TaskEither.map((_) => _.data),
		TaskEither.chainIOK((data) =>
			pipe(
				logger.verboseWithJson('CoinGecko request completed', data),
				IO.map(() => data)
			)
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
		TaskEither.fromIOEither,
		TaskEither.chain((baseUrl) =>
			sendCryptoGeckoRequest(baseUrl, req.path, req.query)
		),
		TaskEither.fold(
			handleCryptoGeckoError(next),
			handleCryptoGeckoData(req, res)
		)
	);
