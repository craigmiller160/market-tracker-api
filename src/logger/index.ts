import { createLogger, transports, format } from 'winston';
import * as IO from 'fp-ts/IO';
import { pipe } from 'fp-ts/function';
import * as O from 'fp-ts/Option';

const myFormat = format.printf(
	({ level, message, timestamp, stack }) =>
		`[${timestamp}] [${level}] - ${stack ?? message}`
);

// TODO figure out how to handle ordering of log messages or else remove IO stuff

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

export const logInfo =
	(message: string): IO.IO<string> =>
	() => {
		logger.info(message);
		return message;
	};

export const logDebug =
	(message: string): IO.IO<string> =>
	() => {
		logger.debug(message);
		return message;
	};

export const logWarn =
	(message: string): IO.IO<string> =>
	() => {
		logger.warn(message);
		return message;
	};

export const logError =
	(message: string, error?: Error): IO.IO<string> =>
	() => {
		logger.error(message);

		pipe(O.fromNullable(error), O.map(logger.error));

		return message;
	};
