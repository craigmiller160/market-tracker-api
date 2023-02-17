import * as Option from 'fp-ts/Option';
import * as TaskEither from 'fp-ts/TaskEither';
import {
	IOT,
	OptionT,
	TaskT,
	TaskTryT
} from '@craigmiller160/ts-functions/types';
import * as Process from '@craigmiller160/ts-functions/Process';
import bodyParer from 'body-parser';
import { logger } from '../logger';
import { flow, pipe } from 'fp-ts/function';
import express, { Express } from 'express';
import { Server } from 'http';
import { createRoutes } from './routes';
import { setupErrorHandler } from './expressErrorHandler';
import https from 'https';
import { httpsOptions } from './tls';
import { setupRequestLogging } from './requestLogging';
import nocache from 'nocache';
import passport from 'passport';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import { nanoid } from 'nanoid';
import { match } from 'ts-pattern';
import { ExpressDependencies } from './ExpressDependencies';
import {
	appRefreshTokenRepository,
	portfolioRepository,
	watchlistRepository
} from '../data/repo';
import * as Reader from 'fp-ts/Reader';
import * as IO from 'fp-ts/IO';
import * as IOEither from 'fp-ts/IOEither';
import { TokenValidationConfig } from '../keycloak/getTokenValidationConfig';
import { createPassport } from '../keycloak/createPassport';

const safeParseInt = (text: string): OptionT<number> =>
	match(parseInt(text))
		.with(NaN, () => Option.none)
		.otherwise((_) => Option.some(_));

const expressListen = (
	app: Express,
	port: number,
	nodeEnv: string
): TaskTryT<Server> => {
	const server = https.createServer(httpsOptions, app);

	return match(nodeEnv)
		.with('test', () => TaskEither.right(server))
		.otherwise(() => wrapListen(server, port));
};

const wrapListen = (server: Server, port: number): TaskTryT<Server> => {
	const doListen: TaskT<OptionT<Error>> = () =>
		new Promise((resolve) =>
			server.listen(port, (err?: Error) =>
				resolve(Option.fromNullable(err))
			)
		);
	return pipe(
		doListen,
		TaskEither.fromTask,
		TaskEither.chain(
			flow(
				Option.fold(
					() => TaskEither.right(server),
					(err) => TaskEither.left(err)
				)
			)
		)
	);
};

export interface ExpressServer {
	readonly server: Server;
	readonly app: Express;
}

const createExpressApp = (
	tokenValidationConfig: TokenValidationConfig
): Express => {
	const app = express();
	const expressDependencies: ExpressDependencies = {
		portfolioRepository,
		watchlistRepository,
		appRefreshTokenRepository,
		expressApp: app
	};
	app.use(cookieParser());
	app.use(
		session({
			secret: nanoid(),
			resave: true,
			saveUninitialized: true
		})
	);
	app.use(nocache());
	app.disable('x-powered-by');
	app.use(bodyParer.json());
	app.use(passport.initialize());

	createPassport(tokenValidationConfig);

	Reader.sequenceArray([
		setupRequestLogging,
		createRoutes,
		setupErrorHandler
	])(expressDependencies);

	return app;
};

const getPort = (): IOT<number> =>
	pipe(
		Process.envLookupO('EXPRESS_PORT'),
		IO.map(
			flow(
				Option.chain(safeParseInt),
				Option.getOrElse(() => 8080)
			)
		)
	);

export const startExpressServer = (
	tokenValidationConfig: TokenValidationConfig
): TaskTryT<ExpressServer> =>
	pipe(
		logger.debug('Starting server'),
		IO.map(() => createExpressApp(tokenValidationConfig)),
		IOEither.rightIO,
		IOEither.bindTo('app'),
		IOEither.bind('port', () => IOEither.rightIO(getPort())),
		IOEither.bind('nodeEnv', () => Process.envLookupE('NODE_ENV')),
		TaskEither.fromIOEither,
		TaskEither.bind('server', ({ app, port, nodeEnv }) =>
			expressListen(app, port, nodeEnv)
		),
		TaskEither.chainFirstIOK(({ port }) =>
			logger.info(`Express server listening on port ${port}`)
		),
		TaskEither.map(({ app, server }) => ({
			server,
			app
		}))
	);
