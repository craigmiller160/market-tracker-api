import { flow, pipe } from 'fp-ts/function';
import * as Option from 'fp-ts/Option';
import * as Either from 'fp-ts/Either';
import { logger } from '../logger';
import { match } from 'ts-pattern';
import { IOT, IOTryT, OptionT } from '@craigmiller160/ts-functions/types';
import * as Process from '@craigmiller160/ts-functions/Process';
import * as IO from 'fp-ts/IO';
import { getRequiredValues } from '../function/Values';
import * as IOEither from 'fp-ts/IOEither';

interface MongoEnv {
	readonly hostname: string;
	readonly port: string;
	readonly user: string;
	readonly password: string;
	readonly adminDb: string;
	readonly db: string;
}

const TLS_SUFFIX =
	'tls=true&tlsAllowInvalidCertificates=true&tlsAllowInvalidHostnames=true';

const createConnectionString = (env: MongoEnv): string =>
	`mongodb://${env.user}:${env.password}@${env.hostname}:${env.port}/${env.db}?authSource=${env.adminDb}`;

interface ConnStringAndEnv {
	readonly connectionString: string;
	readonly nodeEnv: string;
}

const logConnectionStringInDev = (
	connStringAndEnv: ConnStringAndEnv
): IOT<ConnStringAndEnv> =>
	match(connStringAndEnv.nodeEnv)
		.with('development', () =>
			pipe(
				logger.debug(
					`Mongo Connection String: ${connStringAndEnv.connectionString}`
				),
				IO.map(() => connStringAndEnv)
			)
		)
		.otherwise(() => IO.of(connStringAndEnv));

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
				(_) => () => Option.some(_)
			)
		)
	);

const appendTlsSuffix = (connectionString: string, nodeEnv: string): string => {
	if ('development' === nodeEnv) {
		return connectionString;
	}
	return `${connectionString}&${TLS_SUFFIX}`;
};

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
				getRequiredValues,
				Either.map(envToMongoEnv),
				Either.map(createConnectionString)
			)
		),
		IOEither.bindTo('baseConnectionString'),
		IOEither.bind('nodeEnv', () => Process.envLookupE('NODE_ENV')),
		IOEither.bind('connectionString', ({ baseConnectionString, nodeEnv }) =>
			IOEither.right(appendTlsSuffix(baseConnectionString, nodeEnv))
		),
		IOEither.chainIOK(logConnectionStringInDev),
		IOEither.map(({ connectionString }) => connectionString)
	);
};
