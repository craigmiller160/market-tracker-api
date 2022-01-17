import * as E from 'fp-ts/Either';
import { match, when } from 'ts-pattern';

// TODO replace with lib version
export const captureFromRegex = <T>(
	regex: RegExp | string,
	text: string
): E.Either<Error, T> =>
	match(text)
		.with(
			when<string>((_) => RegExp(regex).test(_)),
			(_) => E.right(RegExp(regex).exec(_)?.groups as unknown as T)
		)
		.otherwise(() => E.left(new Error('Text does not match regex')));
