import { ec } from 'elliptic';
import * as E from 'fp-ts/Either';
import * as EU from '../../src/function/EitherUtils';
import KeyEncoder from 'key-encoder';
import { pipe } from 'fp-ts/function';

const keyAlgorithm = 'secp256k1';
const ecInstance = new ec(keyAlgorithm);
const keyEncoder = new KeyEncoder(keyAlgorithm);

export interface TokenKeyPair {
	readonly keyPair: ec.KeyPair;
	readonly publicKey: string;
	readonly privateKey: string;
}

export const createKeyPair = (): E.Either<Error, TokenKeyPair> =>
	pipe(
		EU.tryCatch(() => ecInstance.genKeyPair()),
		E.map((keyPair) => ({
			keyPair,
			publicKey: keyEncoder.encodePublic(
				keyPair.getPublic('hex'),
				'raw',
				'pem'
			),
			privateKey: keyEncoder.encodePrivate(
				keyPair.getPrivate('hex'),
				'raw',
				'pem'
			)
		}))
	);
