import { createLogger, transports, format } from 'winston';
import * as IO from 'fp-ts/IO';
import { pipe } from 'fp-ts/function';
import * as Option from 'fp-ts/Option';
import { instanceOf, match } from 'ts-pattern';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const myFormat = format.printf(
	({ level, message, timestamp, stack }) =>
		`[${timestamp}] [${level}] - ${stack ?? message}`
);

export const logger = createLogger({
	level: 'debug',
	format: format.combine(
		format((info) => {
			info.level = info.level.toUpperCase();
			return info;
		})(),
		format.errors({
			stack: true
		}),
		format.timestamp({
			format: 'YYYY-MM-DD HH:mm:ss.SSS'
		}),
		format.colorize(),
		myFormat
	),
	transports: [new transports.Console()]
});

const getErrorIfExists = (
	errorParam?: Error,
	valueParam?: any // eslint-disable-line @typescript-eslint/no-explicit-any
): Option.Option<Error> =>
	match({ errorParam, valueParam })
		.with({ errorParam: instanceOf(Error) }, ({ errorParam }) =>
			Option.some(errorParam)
		)
		.with({ valueParam: instanceOf(Error) }, ({ valueParam }) =>
			Option.some(valueParam)
		)
		.otherwise(() => Option.none);

export const logAndReturn =
	(level: LogLevel, message: string, error?: Error) =>
	<T>(value: T): T => {
		logger[level](message);
		pipe(
			getErrorIfExists(error, value),
			Option.map((_) => {
				logger[level](_);
				return _;
			})
		);

		return value;
	};

// TODO delete old logger methods

export const logError =
	(message: string, error?: Error): IO.IO<string> =>
	() => {
		logger.error(message);

		pipe(Option.fromNullable(error), Option.map(logger.error));

		return message;
	};
