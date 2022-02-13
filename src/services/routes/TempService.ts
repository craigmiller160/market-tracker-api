// TODO delete this
import { Request, Response } from 'express';

export const hello = (req: Request, res: Response) => {
	res.send(`Hello ${req.path}`);
};
