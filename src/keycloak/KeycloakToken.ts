import * as Option from 'fp-ts/Option';
import { pipe } from 'fp-ts/function';

export type KeycloakToken = {
	readonly exp: number;
	readonly iat: number;
	readonly jti: string;
	readonly iss: string;
	readonly aud: ReadonlyArray<string>;
	readonly sub: string;
	readonly realm_access: {
		readonly roles: ReadonlyArray<string>;
	};
	readonly resource_access: {
		readonly [resource: string]: {
			readonly roles: ReadonlyArray<string>;
		};
	};
	readonly given_name: string;
	readonly family_name: string;
	readonly email: string;
};

export const getUserId = (token: KeycloakToken): string => token.sub;

export const getAllRoles = (token: KeycloakToken): ReadonlyArray<string> => {
	const resourceRoles = pipe(
		Option.fromNullable(process.env.CLIENT_ID),
		Option.chain((clientId) =>
			Option.fromNullable(token.resource_access[clientId]?.roles)
		),
		Option.getOrElse((): ReadonlyArray<string> => [])
	);
	const realmRoles = token.realm_access.roles.map((role) => `realm:${role}`);
	return [...resourceRoles, ...realmRoles];
};
