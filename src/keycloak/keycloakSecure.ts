import passport from 'passport';
import { Route } from '../express/Route';

export const keycloakSecure = (
	requiredRoles: ReadonlyArray<string> = []
): ReadonlyArray<Route> => {
	const fullRequiredRoles = [...requiredRoles, 'access'];
	const isAuthGuard = passport.authenticate('jwt', { session: false });
	const hasRolesGuard: Route = (req, res, next) => {
		console.log(req);
		next();
	};
	return [isAuthGuard, hasRolesGuard];
};
