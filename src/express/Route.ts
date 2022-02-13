import { NextFunction, Request, Response } from 'express';
import { IOT, TaskT } from '@craigmiller160/ts-functions/types';

export type Route = (req: Request, res: Response, next: NextFunction) => void;

// TODO Remove generic
export type TaskRoute = (
	req: Request,
	res: Response,
	next: NextFunction
) => TaskT<void>;

// TODO Remove generic
export type IORoute = (
	req: Request,
	res: Response,
	next: NextFunction
) => IOT<void>;

export const taskRouteToRoute =
	(taskRoute: TaskRoute): Route =>
	(req: Request, res: Response, next: NextFunction) =>
		taskRoute(req, res, next)();

export const ioRouteToRoute =
	(ioRoute: IORoute): Route =>
	(req: Request, res: Response, next: NextFunction) =>
		ioRoute(req, res, next)();

export const emptyRoute = (req: Request, res: Response, next: NextFunction) =>
	next();
