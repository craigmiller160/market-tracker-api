import * as Reader from 'fp-ts/Reader';
import * as RArray from 'fp-ts/ReadonlyArray';

type Print = (msg: string) => string;

interface Dependencies {
	readonly print: Print;
}

const printToConsole: Print = (msg) => {
	console.log(msg);
	return `Printed: ${msg}`;
};
const consoleDependencies: Dependencies = {
	print: printToConsole
};

const printData =
	(data: ReadonlyArray<string>) =>
	(print: Print): ReadonlyArray<string> =>
		RArray.map(print)(data);

const data: ReadonlyArray<string> = ['Hello World', 'Bob Saget', 'JWST'];

const result = printData(data)(printToConsole);
console.log('Result', result);

const printDataReader =
	(
		data: ReadonlyArray<string>
	): Reader.Reader<Dependencies, ReadonlyArray<string>> =>
	(deps) =>
		RArray.map(deps.print)(data);

const printData2 = printDataReader(data);
const result2 = printData2(consoleDependencies);
console.log('Result2', result2);
