import { NextFunction, Request, Response } from 'express';
import { IOT, ReaderTaskT, TaskT } from '@craigmiller160/ts-functions/types';
import { ExpressDependencies } from './ExpressDependencies';

// TODO rename to RouteMiddleware or something
export type Route = (req: Request, res: Response, next: NextFunction) => void;

// TODO if unused, delete. Remove generic
export type ReaderTaskRoute<T> = (
	req: Request,
	res: Response,
	next: NextFunction
) => ReaderTaskT<ExpressDependencies, T>;

// TODO Remove generic
export type TaskRoute<T> = (
	req: Request,
	res: Response,
	next: NextFunction
) => TaskT<T>;

// TODO Remove generic
export type IORoute<T> = (
	req: Request,
	res: Response,
	next: NextFunction
) => IOT<T>;

export const taskRouteToRoute =
	(taskRoute: TaskRoute<void>): Route =>
	(req: Request, res: Response, next: NextFunction) =>
		taskRoute(req, res, next)();

export const ioRouteToRoute =
	(ioRoute: IORoute<void>): Route =>
	(req: Request, res: Response, next: NextFunction) =>
		ioRoute(req, res, next)();
