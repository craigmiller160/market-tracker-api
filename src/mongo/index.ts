import { pipe } from 'fp-ts/function';
import * as TE from 'fp-ts/TaskEither';
import * as TEU from '../function/TaskEitherUtils';
import * as TaskTry from '@craigmiller160/ts-functions/TaskTry';
import mongoose, { Mongoose } from 'mongoose';
import { logDebug, logInfo } from '../logger';
import { getConnectionString } from './connectionString';

const connectToMongoose = (
	connectionString: string
): TEU.TaskEither<typeof mongoose> =>
	TaskTry.tryCatch(() => mongoose.connect(connectionString));

export const connectToMongo = (): TEU.TaskEither<Mongoose> =>
	pipe(
		getConnectionString(),
		TE.fromEither,
		TE.chainFirst(() => TE.fromIO(logDebug('Connecting to MongoDB'))),
		TE.chain(connectToMongoose),
		TE.chainFirst(() => TE.fromIO(logInfo('Connected to MongoDB')))
	);
