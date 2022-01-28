import { Controller } from './Controller';
import * as Reader from 'fp-ts/Reader';

export const healthcheck: Controller = Reader.of((req, res) =>
	res.send('Healthy')
);
