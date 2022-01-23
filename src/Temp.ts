import * as Reader from 'fp-ts/Reader';
import * as RArray from 'fp-ts/ReadonlyArray';

type Print = (msg: string) => string;

const printToConsole: Print = (msg) => {
	console.log(msg);
	return `Printed: ${msg}`;
};

interface Dependencies {
	readonly print: Print;
}

const printData =
	(data: ReadonlyArray<string>) =>
	(print: Print): ReadonlyArray<string> =>
		RArray.map(print)(data);

const data: ReadonlyArray<string> = ['Hello World', 'Bob Saget', 'JWST'];

const result = printData(data)(printToConsole);
console.log('Result', result);
