import { NextFunction, Request, Response } from 'express';
import { logger2 } from '../logger';
import qs from 'qs';
import { format } from 'date-fns';
import { match, when } from 'ts-pattern';
import * as P from 'fp-ts/Predicate';
import { pipe } from 'fp-ts/function';
import { ReaderT } from '@craigmiller160/ts-functions/types';
import * as Reader from 'fp-ts/Reader';
import { ExpressDependencies } from './ExpressDependencies';

interface ErrorResponse {
	readonly timestamp: string;
	readonly status: number;
	readonly message: string;
	readonly request: string;
}

const NO_AUTH_TOKEN_REGEX = /^.*No auth token.*$/;
const UNAUTHORIZED_ERROR_NAMES = [
	'JsonWebTokenError',
	'TokenExpiredError',
	'UnauthorizedError'
];

const isUnauthorizedError: P.Predicate<Error> = pipe(
	(_: Error) => UNAUTHORIZED_ERROR_NAMES.includes(_.name),
	P.or((_) => NO_AUTH_TOKEN_REGEX.test(_.message))
);

const getErrorStatus = (err: Error): number =>
	match(err)
		.with(when(isUnauthorizedError), () => 401)
		.otherwise(() => 500);

const getErrorMessage = (err: Error): string =>
	match(err)
		.with(when(isUnauthorizedError), () => 'Unauthorized')
		.with({ name: 'MissingValuesError' }, () => 'Missing values')
		.otherwise((_) => _.message);

const createErrorResponse = (
	err: Error,
	req: Request,
	status: number
): ErrorResponse => {
	const queryString = qs.stringify(req.query);
	const fullQueryString = queryString.length > 0 ? `?${queryString}` : '';

	const timestamp = format(new Date(), 'yyyy-MM-dd HH:mm:ss.SSS');

	return {
		timestamp,
		status,
		message: getErrorMessage(err),
		request: `${req.method} ${req.path}${fullQueryString}`
	};
};

export const expressErrorHandler = (
	err: Error,
	req: Request,
	res: Response,
	next: NextFunction
): void => {
	logger2.error('Error while processing request');
	logger2.error(err);

	const status = getErrorStatus(err);
	const errorResponse = createErrorResponse(err, req, status);
	res.status(status);
	res.json(errorResponse);
	next();
};

export const setupErrorHandler: ReaderT<ExpressDependencies, void> =
	Reader.asks(({ expressApp }) => expressApp.use(expressErrorHandler));
