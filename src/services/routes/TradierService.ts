import { NextFunction, Request, Response } from 'express';
import { isAxiosError, restClient } from '../RestClient';
import { getRequiredValues2 } from '../../function/Values';
import { flow, identity, pipe } from 'fp-ts/function';
import { TaskT, TaskTryT, TryT } from '@craigmiller160/ts-functions/types';
import { TaskTry } from '@craigmiller160/ts-functions';
import qs from 'qs';
import { match, when } from 'ts-pattern';
import * as TaskEither from 'fp-ts/TaskEither';
import { logAndReturn, logger } from '../../logger';
import { Error } from 'mongoose';
import { AxiosError } from 'axios';
import { TradierError } from '../../error/TradierError';
import * as Option from 'fp-ts/Option';
import * as Json from '@craigmiller160/ts-functions/Json';

const getTradierEnv = (): TryT<ReadonlyArray<string>> =>
	getRequiredValues2([
		process.env.TRADIER_BASE_URL,
		process.env.TRADIER_API_KEY
	]);

const isNotEmpty = (text: string) => text.length > 0;

const sendTradierRequest = (
	baseUrl: string,
	apiKey: string,
	uri: string,
	query: object
): TaskTryT<object | Array<object>> => {
	const queryString = match(qs.stringify(query))
		.with(when(isNotEmpty), (_) => `?${_}`)
		.otherwise(identity);
	const realUri = uri.replace(/^\/tradier/, '');
	const fullTradierRequestUrl = `${baseUrl}${realUri}${queryString}`;
	logger.debug(`Sending request to Tradier: ${fullTradierRequestUrl}`);
	return pipe(
		TaskTry.tryCatch(() =>
			restClient.get(fullTradierRequestUrl, {
				headers: {
					Accept: 'application/json',
					Authorization: `Bearer ${apiKey}`
				}
			})
		),
		TaskEither.map((_) => _.data),
		TaskEither.map(
			logAndReturn('verbose', 'Tradier request completed', true)
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
			.with(
				when(isAxiosError),
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
		TaskEither.fromEither,
		TaskEither.chain(([baseUrl, apiKey]) =>
			sendTradierRequest(baseUrl, apiKey, req.path, req.query)
		),
		TaskEither.fold(handleTradierError(next), (data) => async () => {
			res.json(data);
		})
	);
