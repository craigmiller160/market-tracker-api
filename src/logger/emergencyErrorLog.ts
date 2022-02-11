import path from 'path';
import * as Option from 'fp-ts/Option';
import { pipe } from 'fp-ts/function';
import * as File from '@craigmiller160/ts-functions/File';
import * as IOEither from 'fp-ts/IOEither';
import { logAndReturn } from './index';

const LOG_FILE_PATH = path.join(process.cwd(), 'emergency-log.txt');
type BooleanString = 'true' | 'false';

const useEmergencyErrorLog = (): BooleanString =>
	pipe(
		Option.fromNullable(
			process.env.USE_EMERGENCY_ERROR_LOG as BooleanString | undefined
		),
		Option.getOrElse((): BooleanString => 'false')
	);

const appendToLogFile = File.appendFileSync(LOG_FILE_PATH);

export const emergencyErrorLog = (timestamp: string, err: Error) => {
	if (useEmergencyErrorLog() === 'true') {
		pipe(
			appendToLogFile(`${timestamp}\n`),
			IOEither.chain(() => appendToLogFile(`${err.stack ?? ''}\n`)),
			IOEither.mapLeft(
				logAndReturn('error', 'Error writing to emergency error log')
			)
		)();
	}
};
