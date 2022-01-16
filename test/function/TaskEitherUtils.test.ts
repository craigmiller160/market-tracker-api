import { multiTypeSequence } from '../../src/function/TaskEitherUtils';
import * as TE from 'fp-ts/TaskEither';
import '@relmify/jest-fp-ts';

describe('TaskEitherUtils', () => {
	describe('multiTypeSequence', () => {
		it('one argument', async () => {
			const result = await multiTypeSequence(TE.of('A'))();
			expect(result).toEqualRight(['A']);
		});

		it('two arguments', async () => {
			const result = await multiTypeSequence(TE.of('A'), TE.of(2))();
			expect(result).toEqualRight(['A', 2]);
		});

		it('three arguments', async () => {
			const result = await multiTypeSequence(
				TE.of('A'),
				TE.of(2),
				TE.of('C')
			)();
			expect(result).toEqualRight(['A', 2, 'C']);
		});

		it('four arguments', async () => {
			const result = await multiTypeSequence(
				TE.of('A'),
				TE.of(2),
				TE.of('C'),
				TE.of('D')
			)();
			expect(result).toEqualRight(['A', 2, 'C', 'D']);
		});

		it('five arguments', async () => {
			const result = await multiTypeSequence(
				TE.of('A'),
				TE.of(2),
				TE.of('C'),
				TE.of('D'),
				TE.of('E')
			)();
			expect(result).toEqualRight(['A', 2, 'C', 'D', 'E']);
		});

		it('six arguments', async () => {
			const result = await multiTypeSequence(
				TE.of('A'),
				TE.of(2),
				TE.of('C'),
				TE.of('D'),
				TE.of('E'),
				TE.of('F')
			)();
			expect(result).toEqualRight(['A', 2, 'C', 'D', 'E', 'F']);
		});

		it('seven arguments', async () => {
			const result = await multiTypeSequence(
				TE.of('A'),
				TE.of(2),
				TE.of('C'),
				TE.of('D'),
				TE.of('E'),
				TE.of('F'),
				TE.of('G')
			)();
			expect(result).toEqualRight(['A', 2, 'C', 'D', 'E', 'F', 'G']);
		});
	});
});
