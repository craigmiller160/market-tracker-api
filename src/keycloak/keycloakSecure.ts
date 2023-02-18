import passport from 'passport';
import { Route } from '../express/Route';
import { getAllRoles, KeycloakToken } from './KeycloakToken';
import { AccessDeniedError } from '../error/AccessDeniedError';

export const keycloakSecure = (
	requiredRoles: ReadonlyArray<string> = []
): ReadonlyArray<Route> => {
	const fullRequiredRoles = [...requiredRoles, 'access'];
	const isAuthGuard = passport.authenticate('jwt', { session: false });
	const hasRolesGuard: Route = (req, res, next) => {
		const token = req.user as KeycloakToken;
		const roles = getAllRoles(token);
		const missingRequiredRoleCount = fullRequiredRoles.filter(
			(role) => !roles.includes(role)
		).length;
		if (missingRequiredRoleCount === 0) {
			next();
		} else {
			next(new AccessDeniedError());
		}
	};
	return [isAuthGuard, hasRolesGuard];
};
