export class MissingValuesError extends Error {
	public readonly name = 'MissingValuesError';

	constructor(msg?: string) {
		super(msg);
	}
}
