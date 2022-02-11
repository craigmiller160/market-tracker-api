import axios, { AxiosError } from 'axios';
import https from 'https';
import { Error } from 'mongoose';

export const restClient = axios.create({
	httpsAgent: new https.Agent({
		rejectUnauthorized: false
	})
});

export const isAxiosError = (ex: Error): ex is AxiosError =>
	(ex as unknown as { response: object | undefined }).response !== undefined;
