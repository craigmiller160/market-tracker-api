import { Request, Response } from 'express';
import {
	getAllRoles,
	getUserId,
	KeycloakToken
} from '../../keycloak/KeycloakToken';

export const getAuthUser = (req: Request, res: Response): void => {
	const token = req.user as KeycloakToken;
	res.send({
		sub: token.sub,
		firstName: token.given_name,
		lastName: token.family_name,
		userId: getUserId(token),
		userEmail: token.email,
		roles: getAllRoles(token)
	});
};
