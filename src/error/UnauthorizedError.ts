export class UnauthorizedError extends Error {
	public readonly name = 'UnauthorizedError';

	constructor(msg?: string) {
		super(msg);
	}
}
