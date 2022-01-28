import { NextFunction, Request, Response } from 'express';
import { ReaderTaskT } from '@craigmiller160/ts-functions/types';
import { ExpressDependencies } from './ExpressDependencies';

export type Route = (req: Request, res: Response, next: NextFunction) => void;

export type ReaderTaskRoute<T> = (
	req: Request,
	res: Response,
	next: NextFunction
) => ReaderTaskT<ExpressDependencies, T>;
