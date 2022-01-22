import { pipe } from 'fp-ts/function';
import * as TE from 'fp-ts/TaskEither';
import * as TaskTry from '@craigmiller160/ts-functions/TaskTry';
import mongoose, { Mongoose } from 'mongoose';
import { logger } from '../logger';
import { getConnectionString } from './connectionString';

const connectToMongoose = (
	connectionString: string
): TaskTry.TaskTry<typeof mongoose> =>
	TaskTry.tryCatch(() => mongoose.connect(connectionString));

export const connectToMongo = (): TaskTry.TaskTry<Mongoose> =>
	pipe(
		getConnectionString(),
		TE.fromEither,
		TE.map((_) => {
			logger.debug('Connecting to MongoDB');
			return _;
		}),
		TE.chain(connectToMongoose),
		TE.map((_) => {
			logger.info('Connected to MongoDB');
			return _;
		})
	);
