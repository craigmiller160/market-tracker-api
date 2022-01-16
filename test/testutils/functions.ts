/* eslint-disable @typescript-eslint/ban-types */

type WithMongooseId<T extends {}> = T & {
	__v?: number;
	_id?: string;
};

export const removeId = <T extends {}>(
	withMongooseId: WithMongooseId<T>
): T => {
	const newObj = { ...withMongooseId };
	delete newObj.__v;
	delete newObj._id;
	return newObj;
};
