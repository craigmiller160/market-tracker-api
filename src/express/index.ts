import * as Option from 'fp-ts/Option';
import * as TaskEither from 'fp-ts/TaskEither';
import * as TaskTry from '@craigmiller160/ts-functions/TaskTry';
import { TaskTryT, OptionT } from '@craigmiller160/ts-functions/types';

import bodyParer from 'body-parser';
import { logger } from '../logger';
import { pipe } from 'fp-ts/function';
import express, { Express } from 'express';
import { Server } from 'http';
import { createRoutes } from './routes';
import { setupErrorHandler } from './expressErrorHandler';
import https from 'https';
import { httpsOptions } from './tls';
import { setupRequestLogging } from './requestLogging';
import nocache from 'nocache';
import { TokenKey } from '../services/auth/TokenKey';
import passport from 'passport';
import { createPassportValidation } from './auth/passport';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import { nanoid } from 'nanoid';
import { __, match } from 'ts-pattern';
import { ExpressDependencies } from './ExpressDependencies';
import {
	appRefreshTokenRepository,
	portfolioRepository,
	watchlistRepository
} from '../data/repo';
import * as Reader from 'fp-ts/Reader';

const safeParseInt = (text: string): OptionT<number> =>
	match(parseInt(text))
		.with(__.NaN, () => Option.none)
		.otherwise((_) => Option.some(_));

const expressListen = (app: Express, port: number): TaskTryT<Server> => {
	const server = https.createServer(httpsOptions, app);

	return match(process.env.NODE_ENV)
		.with('test', () => TaskEither.right(server))
		.otherwise(() => TaskTry.tryCatch(() => wrapListen(server, port)));
};

const wrapListen = (server: Server, port: number): Promise<Server> =>
	new Promise((resolve, reject) => {
		server.listen(port, (err?: Error) => {
			pipe(
				Option.fromNullable(err),
				Option.fold(
					() => {
						logger.info(
							`Market Tracker API listening on port ${port}`
						);
						resolve(server);
					},
					(_) => reject(_)
				)
			);
		});
	});

export interface ExpressServer {
	readonly server: Server;
	readonly app: Express;
}

const createExpressApp = (tokenKey: TokenKey): Express => {
	const app = express();
	const expressDependencies: ExpressDependencies = {
		portfolioRepository,
		watchlistRepository,
		appRefreshTokenRepository,
		expressApp: app,
		tokenKey
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

	Reader.sequenceArray([
		setupRequestLogging,
		createRoutes,
		setupErrorHandler,
		createPassportValidation
	])(expressDependencies);

	return app;
};

export const startExpressServer = (
	tokenKey: TokenKey
): TaskTryT<ExpressServer> => {
	const port = pipe(
		Option.fromNullable(process.env.EXPRESS_PORT),
		Option.chain(safeParseInt),
		Option.getOrElse(() => 8080)
	);

	logger.debug('Starting server');

	const app = createExpressApp(tokenKey);

	return pipe(
		expressListen(app, port),
		TaskEither.map((_) => ({
			server: _,
			app
		}))
	);
};
