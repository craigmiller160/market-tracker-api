export class CryptoGeckoError extends Error {
	public readonly name = 'CryptoGeckoError';

	constructor(msg?: string) {
		super(msg);
	}
}
