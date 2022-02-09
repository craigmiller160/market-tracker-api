import path from 'path';
import fs from 'fs';
import { ServerOptions } from 'https';
import { constants } from 'crypto';
import { match } from 'ts-pattern';

const basePath = match(process.env.NODE_ENV)
	.with('production', () => '')
	.otherwise(() => path.join(__dirname, '..', 'cert'));

const keyPath = path.join(basePath, 'market-tracker.key.pem');
const certPath = path.join(basePath, 'market-tracker.cert.pem');

const ciphers = [
	'ECDHE-ECDSA-AES256-GCM-SHA384',
	'ECDHE-RSA-AES256-GCM-SHA384',
	'ECDHE-ECDSA-CHACHA20-POLY1305',
	'ECDHE-RSA-CHACHA20-POLY1305',
	'ECDHE-ECDSA-AES128-GCM-SHA256',
	'ECDHE-RSA-AES128-GCM-SHA256',
	'ECDHE-ECDSA-AES256-SHA384',
	'ECDHE-RSA-AES256-SHA384',
	'ECDHE-ECDSA-AES128-SHA256',
	'ECDHE-RSA-AES128-SHA256'
];

export const httpsOptions: ServerOptions = {
	key: fs.readFileSync(keyPath),
	cert: fs.readFileSync(certPath),
	ciphers: ciphers.join(';'),
	secureOptions:
		constants.SSL_OP_NO_TLSv1_1 |
		constants.SSL_OP_NO_TLSv1 |
		constants.SSL_OP_NO_SSLv3 |
		constants.SSL_OP_NO_SSLv2
};
