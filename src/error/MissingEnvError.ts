export class MissingEnvError extends Error {
	public readonly name = 'MissingEnvError';

	constructor(msg?: string) {
		super(msg);
	}
}
