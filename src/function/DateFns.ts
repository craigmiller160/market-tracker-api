import {
	addMinutes as baseAddMinutes,
	format as baseFormat,
	parse as baseParse,
	compareAsc as baseCompareAsc
} from 'date-fns';

export const addMinutes =
	(amount: number) =>
	(date: Date): Date =>
		baseAddMinutes(date, amount);

export const format =
	(formatString: string) =>
	(date: Date): string =>
		baseFormat(date, formatString);

export const parse =
	(formatString: string) =>
	(dateString: string): Date =>
		baseParse(dateString, formatString, new Date());

export const compareAsc =
	(dateLeft: Date) =>
	(dateRight: Date): number =>
		baseCompareAsc(dateLeft, dateRight);
