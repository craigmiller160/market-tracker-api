import { Request, Response } from 'express';

export const healthcheck = (req: Request, res: Response) => {
	res.send('Healthy');
};
