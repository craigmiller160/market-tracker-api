/* eslint-disable no-console */
import spawn from 'cross-spawn';
import { SpawnSyncReturns } from 'child_process';

const runCommand = (command: string): SpawnSyncReturns<Buffer> => {
	console.log(`Command: ${command}`);
	const result = spawn.sync('bash', ['-c', command], {
		stdio: 'inherit'
	});

	if (result.status ?? 1 > 0) {
		throw new Error('Command failed');
	}

	return result;
};

runCommand('rm -rf build');
runCommand('tsc');
