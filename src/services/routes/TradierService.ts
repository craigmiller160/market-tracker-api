import { NextFunction, Request, Response } from 'express';
import { isAxiosError, restClient } from '../RestClient';
import { getRequiredValues } from '../../function/Values';
import { flow, identity, pipe } from 'fp-ts/function';
import {
	IOT,
	IOTryT,
	OptionT,
	TaskT,
	TaskTryT
} from '@craigmiller160/ts-functions/types';
import { TaskTry } from '@craigmiller160/ts-functions';
import qs from 'qs';
import { match } from 'ts-pattern';
import * as TaskEither from 'fp-ts/TaskEither';
import { logger } from '../../logger';
import { Error } from 'mongoose';
import { AxiosError } from 'axios';
import { TradierError } from '../../error/TradierError';
import * as Option from 'fp-ts/Option';
import * as Json from '@craigmiller160/ts-functions/Json';
import * as Process from '@craigmiller160/ts-functions/Process';
import * as IO from 'fp-ts/IO';

const getTradierEnv = (): IOTryT<ReadonlyArray<string>> => {
	const env: ReadonlyArray<IOT<OptionT<string>>> = [
		Process.envLookupO('TRADIER_BASE_URL'),
		Process.envLookupO('TRADIER_API_KEY')
	];

	return pipe(IO.sequenceArray(env), IO.map(getRequiredValues));
};

const isNotEmpty = (text: string) => text.length > 0;

const sendTradierRequest = (
	baseUrl: string,
	apiKey: string,
	uri: string,
	query: object
): TaskTryT<object | Array<object>> => {
	const queryString = match(qs.stringify(query))
		.when(isNotEmpty, (_) => `?${_}`)
		.otherwise(identity);
	const realUri = uri.replace(/^\/tradier/, '');
	const fullTradierRequestUrl = `${baseUrl}${realUri}${queryString}`;
	return pipe(
		logger.debug(`Sending request to Tradier: ${fullTradierRequestUrl}`),
		TaskEither.rightIO,
		TaskEither.chain(() =>
			TaskTry.tryCatch(() =>
				restClient.get(fullTradierRequestUrl, {
					headers: {
						Accept: 'application/json',
						Authorization: `Bearer ${apiKey}`
					}
				})
			)
		),
		TaskEither.map((_) => _.data),
		TaskEither.chainIOK((data) =>
			pipe(
				logger.verboseWithJson('Tradier request completed', data),
				IO.map(() => data)
			)
		)
	);
};

const buildTradierErrorMessage = (ex: AxiosError): string =>
	pipe(
		Option.fromNullable(ex.response),
		Option.bindTo('response'),
		Option.bind('status', ({ response }) => Option.of(response.status)),
		Option.bind(
			'data',
			flow(
				() => Option.of(ex.response?.data),
				Option.fold(() => ({}), identity),
				Json.stringifyO
			)
		),
		Option.map(
			({ status, data }) =>
				`Error calling Tradier. Status: ${status} Message: ${data}`
		),
		Option.getOrElse(() => 'Error calling Tradier. No data on error.')
	);

const handleTradierError =
	(next: NextFunction) =>
	(ex: Error): TaskT<void> => {
		const handledError = match(ex)
			.when(
				isAxiosError,
				(_) => new TradierError(buildTradierErrorMessage(_))
			)
			.otherwise(identity);
		return async () => {
			next(handledError);
		};
	};

export const queryTradier = (
	req: Request,
	res: Response,
	next: NextFunction
): TaskT<void> =>
	pipe(
		getTradierEnv(),
		TaskEither.fromIOEither,
		TaskEither.chain(([baseUrl, apiKey]) =>
			sendTradierRequest(baseUrl, apiKey, req.path, req.query)
		),
		TaskEither.fold(handleTradierError(next), (data) => async () => {
			res.json(data);
		})
	);
