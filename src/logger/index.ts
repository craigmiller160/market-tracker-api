import { createLogger, transports, format } from 'winston';
import TransportStream from 'winston-transport';
import { instanceOf, match } from 'ts-pattern';
import { Json } from '@craigmiller160/ts-functions';
import * as Either from 'fp-ts/Either';
import path from 'path';
import * as RArray from 'fp-ts/ReadonlyArray';
import * as RArrayExt from '@craigmiller160/ts-functions/ReadonlyArrayExt';
import { pipe } from 'fp-ts/function';
import { PredicateT } from '@craigmiller160/ts-functions/types';
import * as Process from '@craigmiller160/ts-functions/Process';
import * as Option from 'fp-ts/Option';
import * as IO from 'fp-ts/IO';

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'verbose';

const myFormat = format.printf(
	({ level, message, timestamp, stack }) =>
		`[${timestamp}] [${level}] - ${stack ?? message}`
);

const isNotProduction: PredicateT<void> = pipe(
	Process.envLookupO('NODE_ENV'),
	IO.map(Option.filter((_) => _ !== 'production')),
	IO.map(Option.isSome)
);

const theTransports: ReadonlyArray<TransportStream> = pipe(
	Process.cwd(),
	IO.map((cwd) =>
		pipe(
			[
				new transports.Console(),
				isNotProduction()
					? new transports.File({
							filename: path.join(
								cwd,
								'logs',
								'market-tracker.log'
							),
							maxsize: 100_000,
							maxFiles: 10
					  })
					: null
			],
			RArray.filter((_) => _ !== null)
		)
	)
)() as ReadonlyArray<TransportStream>;

export const logger = createLogger({
	level: 'debug',
	levels: {
		error: 1,
		warn: 2,
		info: 3,
		debug: 4,
		verbose: 5
	},
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
	transports: RArrayExt.toMutable(theTransports)
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
				Either.getOrElse(() => '')(Json.stringifyE(value))
			)
			.otherwise(() => '');

		logger[level](`${message} ${valueMsg}`);

		return value;
	};
