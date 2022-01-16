import { MongoMemoryServer } from 'mongodb-memory-server';
import * as TEU from '../../src/function/TaskEitherUtils';
import mongoose, { Mongoose } from 'mongoose';

export interface MongoTestServer {
	readonly mongoServer: MongoMemoryServer;
	readonly mongooseInstance: Mongoose;
}

export const createMongoTestServer = (): TEU.TaskEither<MongoTestServer> =>
	TEU.tryCatch(async () => {
		const mongoServer: MongoMemoryServer = await MongoMemoryServer.create();
		const mongooseInstance: Mongoose = await mongoose.connect(
			mongoServer.getUri()
		);
		return {
			mongoServer,
			mongooseInstance
		};
	});

export const stopMongoTestServer = (
	mongoTestServer: MongoTestServer
): TEU.TaskEither<void> =>
	TEU.tryCatch(async () => {
		await mongoTestServer.mongooseInstance.disconnect();
		await mongoTestServer.mongoServer.stop();
	});
