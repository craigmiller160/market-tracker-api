import { createLogger, transports, format } from 'winston';
import { instanceOf, match } from 'ts-pattern';
import { Json } from '@craigmiller160/ts-functions';
import * as Either from 'fp-ts/Either';

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

export const logAndReturn =
	(level: LogLevel, message: string, logNonErrorValue = false) =>
	<T>(value: T): T => {
		const valueMsg = match({ value, logNonErrorValue })
			.with(
				{ value: instanceOf(Error) },
				() => (value as unknown as Error).stack ?? ''
			)
			.with({ logNonErrorValue: true }, () =>
				Either.getOrElse(() => '')(Json.stringify(value))
			)
			.otherwise(() => '');

		logger[level](`${message} ${valueMsg}`);

		return value;
	};
