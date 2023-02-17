import { NextFunction, Request, Response } from 'express';
import { logger } from '../logger';
import qs from 'qs';
import { format } from 'date-fns';
import { match } from 'ts-pattern';
import * as P from 'fp-ts/Predicate';
import { pipe } from 'fp-ts/function';
import { ReaderT } from '@craigmiller160/ts-functions/types';
import * as Reader from 'fp-ts/Reader';
import { ExpressDependencies } from './ExpressDependencies';
import { Error } from 'mongoose';

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
const MONGO_ERROR_NAMES = ['MongoServerError', 'MongoBulkWriteError'];

const isUnauthorizedError: P.Predicate<Error> = pipe(
	(_: Error) => UNAUTHORIZED_ERROR_NAMES.includes(_.name),
	P.or((_) => NO_AUTH_TOKEN_REGEX.test(_.message))
);

const isAccessDeniedError: P.Predicate<Error> = (_) =>
	_.name === 'AccessDenied';

const isMongoConstraintError: P.Predicate<Error> = pipe(
	(_: Error) => MONGO_ERROR_NAMES.includes(_.name),
	P.and((_) => _.message.includes('duplicate key error'))
);

const isBadRequestError: P.Predicate<Error> = pipe(
	(_: Error) => _.name === 'BadRequestError',
	P.or(isMongoConstraintError)
);

const getErrorStatus = (err: Error): number =>
	match(err)
		.when(isUnauthorizedError, () => 401)
		.when(isBadRequestError, () => 400)
		.when(isAccessDeniedError, () => 403)
		.otherwise(() => 500);

const getErrorMessage = (err: Error): string =>
	match(err)
		.when(isUnauthorizedError, () => 'Unauthorized')
		.when(isAccessDeniedError, () => 'Access Denied')
		.when(isMongoConstraintError, () => 'Bad Request')
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
	logger.errorWithStack('Error while processing request', err)();

	const status = getErrorStatus(err);
	const errorResponse = createErrorResponse(err, req, status);
	res.status(status);
	res.json(errorResponse);
	next();
};

export const setupErrorHandler: ReaderT<ExpressDependencies, void> =
	Reader.asks(({ expressApp }) => expressApp.use(expressErrorHandler));
