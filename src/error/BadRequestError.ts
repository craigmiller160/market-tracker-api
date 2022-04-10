export class BadRequestError extends Error {
	public readonly name = 'BadRequestError';

	constructor(msg?: string) {
		super(msg);
	}
}
