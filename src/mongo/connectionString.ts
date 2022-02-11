import { flow, pipe } from 'fp-ts/function';
import * as Option from 'fp-ts/Option';
import * as Either from 'fp-ts/Either';
import { logger } from '../logger';
import { match } from 'ts-pattern';
import { IOT, IOTryT, OptionT } from '@craigmiller160/ts-functions/types';
import * as Process from '@craigmiller160/ts-functions/Process';
import * as IO from 'fp-ts/IO';

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
		.with('development', () => {
			logger.debug(`Mongo Connection String: ${connectionString}`);
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

const getMongoPasswordEnv = (): IOT<OptionT<string>> =>
	pipe(
		Process.envLookupO('MONGO_PASSWORD'),
		IO.chain(
			Option.fold(
				() => Process.envLookupO('MONGO_ROOT_PASSWORD'),
				(_) => IO.of(Option.of(_))
			)
		)
	);

export const getConnectionString = (): IOTryT<string> => {
	const envArray: ReadonlyArray<IOT<OptionT<string>>> = [
		Process.envLookupO('MONGO_HOSTNAME'),
		Process.envLookupO('MONGO_PORT'),
		Process.envLookupO('MONGO_USER'),
		getMongoPasswordEnv(),
		Process.envLookupO('MONGO_AUTH_DB'),
		Process.envLookupO('MONGO_DB')
	];

	return pipe(
		envArray,
		IO.sequenceArray,
		IO.map(
			flow(
				Option.sequenceArray,
				Option.map(envToMongoEnv),
				Option.map(createConnectionString),
				Option.map(logConnectionStringInDev),
				Either.fromOption(
					() =>
						new Error(
							'Missing environment variables for Mongo connection'
						)
				)
			)
		)
	);
};
