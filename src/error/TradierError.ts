export class TradierError extends Error {
	public readonly name = 'TradierError';

	constructor(msg?: string) {
		super(msg);
	}
}
