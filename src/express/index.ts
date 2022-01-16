import * as O from 'fp-ts/Option';
import * as E from 'fp-ts/Either';
import * as TE from 'fp-ts/TaskEither';
import * as TEU from '../function/TaskEitherUtils';

import bodyParer from 'body-parser';
import { logError, logger, logInfo } from '../logger';
import { pipe } from 'fp-ts/function';
import express, { Express } from 'express';
import { Server } from 'http';
import { createRoutes } from './routes';
import { setupErrorHandler } from './errorHandler';
import https from 'https';
import { httpsOptions } from './tls';
import { setupRequestLogging } from './requestLogging';
import nocache from 'nocache';
import { TokenKey } from '../auth/TokenKey';
import passport from 'passport';
import { createPassportValidation } from './TokenValidation';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import { nanoid } from 'nanoid';

const safeParseInt = (text: string): O.Option<number> =>
	pipe(
		E.tryCatch(
			() => parseInt(text),
			(error) =>
				logError(
					`Error parsing EXPRESS_PORT environment variable: ${error}`
				)
		),
		O.fromEither
	);

const expressListen = (app: Express, port: number): TEU.TaskEither<Server> =>
	TEU.tryCatch(
		() =>
			new Promise((resolve, reject) => {
				const server = https
					.createServer(httpsOptions, app)
					.listen(port, (err?: Error) => {
						pipe(
							O.fromNullable(err),
							O.fold(
								() => {
									logInfo(
										`Market Tracker API listening on port ${port}`
									)();
									resolve(server);
								},
								(_) => reject(_)
							)
						);
					});
			})
	);

export interface ExpressServer {
	readonly server: Server;
	readonly app: Express;
}

const createExpressApp = (tokenKey: TokenKey): Express => {
	const app = express();
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
	setupRequestLogging(app);
	createRoutes(app);
	createPassportValidation(tokenKey);
	setupErrorHandler(app);
	return app;
};

export const startExpressServer = (
	tokenKey: TokenKey
): TEU.TaskEither<ExpressServer> => {
	const port = pipe(
		O.fromNullable(process.env.EXPRESS_PORT),
		O.chain(safeParseInt),
		O.getOrElse(() => 8080)
	);

	logger.debug('Starting server');

	const app = createExpressApp(tokenKey);

	return pipe(
		expressListen(app, port),
		TE.map((_) => ({
			server: _,
			app
		}))
	);
};
