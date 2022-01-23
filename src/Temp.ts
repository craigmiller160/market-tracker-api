import * as Reader from 'fp-ts/Reader';
import * as RArray from 'fp-ts/ReadonlyArray'

type Print = (msg: string) => void;

const printToConsole: Print = (msg) => console.log(msg);

interface Dependencies {
    readonly print: Print;
}

const printData = (data: ReadonlyArray<string>) => (print: Print): unknown =>
    RArray.map(print)(data);

const data: ReadonlyArray<string> = [
    'Hello World',
    'Bob Saget',
    'JWST'
];

printData(data)(printToConsole);