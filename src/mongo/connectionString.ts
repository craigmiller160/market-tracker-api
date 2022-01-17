import * as Try from '@craigmiller160/ts-functions/Try';
import { pipe } from 'fp-ts/function';
import * as O from 'fp-ts/Option';
import * as E from 'fp-ts/Either';
import { logDebug } from '../logger';
import * as A from 'fp-ts/Array';
import { match } from 'ts-pattern';

interface MongoEnv {
	readonly hostname: string;
	readonly port: string;
	readonly user: string;
	readonly password: string;
	readonly adminDb: string;
	readonly db: string;
}

const createConnectionString = (env: MongoEnv): string =>
	`mongodb://${env.user}:${env.password}@${env.hostname}:${env.port}/${env.db}?authSource=${env.adminDb}&tls=true&tlsAllowInvalidCertificates=true&tlsAllowInvalidHostnames=true`;

const logConnectionStringInDev = (connectionString: string): string =>
	match(process.env.NODE_ENV)
		.with('production', () => {
			logDebug(`Mongo Connection String: ${connectionString}`)();
			return connectionString;
		})
		.otherwise(() => connectionString);

const envToMongoEnv = ([
	hostname,
	port,
	user,
	password,
	adminDb,
	db
]: readonly string[]): MongoEnv => ({
	hostname,
	port,
	user,
	password,
	adminDb,
	db
});

const nullableEnvToMongoEnv = ([
	hostname,
	port,
	user,
	password,
	adminDb,
	db
]: ReadonlyArray<string | undefined>): Partial<MongoEnv> => ({
	hostname,
	port,
	user,
	password,
	adminDb,
	db
});

const getMongoPasswordEnv = (): string | undefined =>
	pipe(
		O.fromNullable(process.env.MONGO_PASSWORD),
		O.getOrElse(() => process.env.MONGO_ROOT_PASSWORD)
	);

export const getConnectionString = (): Try.Try<string> => {
	const nullableEnvArray: Array<string | undefined> = [
		process.env.MONGO_HOSTNAME,
		process.env.MONGO_PORT,
		process.env.MONGO_USER,
		getMongoPasswordEnv(),
		process.env.MONGO_AUTH_DB,
		process.env.MONGO_DB
	];

	return pipe(
		nullableEnvArray,
		A.map(O.fromNullable),
		O.sequenceArray,
		O.map(envToMongoEnv),
		O.map(createConnectionString),
		O.map(logConnectionStringInDev),
		E.fromOption(
			() =>
				new Error(
					`Missing environment variables for Mongo connection: ${JSON.stringify(
						nullableEnvToMongoEnv(nullableEnvArray)
					)}`
				)
		)
	);
};
