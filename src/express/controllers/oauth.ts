import { Request, Response } from 'express';
import { secure } from '../auth/secure';
import * as oAuthService from '../../services/routes/OAuthService';
import { ReaderT } from '@craigmiller160/ts-functions/types';
import { ExpressDependencies } from '../ExpressDependencies';
import { Route } from '../Route';

export const getAuthUser: ReaderT<ExpressDependencies, Route> = secure(
	oAuthService.getAuthUser
);

export const getAuthCodeLogin: Route = (req, res, next) =>
	oAuthService.getAuthCodeLogin(req, res, next)();
