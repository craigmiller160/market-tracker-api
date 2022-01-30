import { NextFunction, Request, Response } from 'express';
import { restClient } from '../RestClient';
import { getRequiredValues } from '../../function/Values';
import { identity, pipe } from 'fp-ts/function';
import { TaskT, TaskTryT, TryT } from '@craigmiller160/ts-functions/types';
import { TaskTry } from '@craigmiller160/ts-functions';
import qs from 'qs';
import { match, when } from 'ts-pattern';
import * as TaskEither from 'fp-ts/TaskEither';
import { errorTask } from '../../function/Route';
import * as Task from 'fp-ts/Task';

const getTradierEnv = (): TryT<ReadonlyArray<string>> =>
	getRequiredValues([
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
	return pipe(
		TaskTry.tryCatch(() =>
			restClient.get(`${baseUrl}${realUri}${queryString}`, {
				headers: {
					Accept: 'application/json',
					Authorization: `Bearer ${apiKey}`
				}
			})
		),
		TaskEither.map((_) => _.data)
	);
};

export const queryTradier = (
	req: Request,
	res: Response,
	next: NextFunction
): TaskT<string> =>
	pipe(
		getTradierEnv(),
		TaskEither.fromEither,
		TaskEither.chain(([baseUrl, apiKey]) =>
			sendTradierRequest(baseUrl, apiKey, req.path, req.query)
		),
		TaskEither.fold(errorTask(next), (data) => {
			res.json(data);
			return Task.of('');
		})
	);
