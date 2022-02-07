import path from 'path';
import * as Option from 'fp-ts/Option';
import { pipe } from 'fp-ts/function';
import * as File from '@craigmiller160/ts-functions/File';
import * as Either from 'fp-ts/Either';
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

export const emergencyErrorLog = (timestamp: string, err: Error) => {
	if (useEmergencyErrorLog() === 'true') {
		pipe(
			File.appendFileSync(LOG_FILE_PATH, `${timestamp}\n`),
			Either.chain(() =>
				File.appendFileSync(LOG_FILE_PATH, `${err.stack ?? ''}\n`)
			),
			Either.mapLeft(
				logAndReturn('error', 'Error writing to emergency error log')
			)
		);
	}
};
