export interface AccessToken {
	readonly sub: string;
	readonly clientName: string;
	readonly clientKey: string;
	readonly firstName: string;
	readonly lastName: string;
	readonly userId: number;
	readonly userEmail: string;
	readonly roles: string[];
	readonly jti: string;
}
