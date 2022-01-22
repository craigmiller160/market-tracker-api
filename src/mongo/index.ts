import { pipe } from 'fp-ts/function';
import * as TaskEither from 'fp-ts/TaskEither';
import * as TaskTry from '@craigmiller160/ts-functions/TaskTry';
import mongoose, { Mongoose } from 'mongoose';
import { logAndReturn } from '../logger';
import { getConnectionString } from './connectionString';

const connectToMongoose = (
	connectionString: string
): TaskTry.TaskTry<typeof mongoose> =>
	TaskTry.tryCatch(() => mongoose.connect(connectionString));

export const connectToMongo = (): TaskTry.TaskTry<Mongoose> =>
	pipe(
		getConnectionString(),
		TaskEither.fromEither,
		TaskEither.map(logAndReturn('debug', 'Connecting to MongoDB')),
		TaskEither.chain(connectToMongoose),
		TaskEither.map(logAndReturn('info', 'Connected to MongoDB'))
	);
