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
