import { NextFunction, Request, Response } from 'express';
import { IOT, ReaderTaskT, TaskT } from '@craigmiller160/ts-functions/types';
import { ExpressDependencies } from './ExpressDependencies';

export type Route = (req: Request, res: Response, next: NextFunction) => void;

export type ReaderTaskRoute<T> = (
	req: Request,
	res: Response,
	next: NextFunction
) => ReaderTaskT<ExpressDependencies, T>;

export type TaskRoute<T> = (
	req: Request,
	res: Response,
	next: NextFunction
) => TaskT<T>;

export type IORoute<T> = (
	req: Request,
	res: Response,
	next: NextFunction
) => IOT<T>;
