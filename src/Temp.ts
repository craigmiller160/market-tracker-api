/* eslint-disable no-console, @typescript-eslint/no-unused-vars */
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

const data: ReadonlyArray<string> = ['Hello World', 'Bob Saget', 'JWST'];

const manualSolution = () => {
	const printData =
		(data: ReadonlyArray<string>) =>
		(print: Print): ReadonlyArray<string> =>
			RArray.map(print)(data);

	const result = printData(data)(printToConsole);
	console.log('Result', result);
};

const readerSolution = () => {
	const printDataReader =
		(
			data: ReadonlyArray<string>
		): Reader.Reader<Dependencies, ReadonlyArray<string>> =>
		(deps) =>
			RArray.map(deps.print)(data);

	const printData = printDataReader(data);
	const result = printData(consoleDependencies);
	console.log('Result', result);
};
