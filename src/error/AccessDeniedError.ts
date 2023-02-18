export class AccessDeniedError extends Error {
	public readonly name = 'AccessDenied';

	constructor(msg?: string) {
		super(msg);
	}
}
