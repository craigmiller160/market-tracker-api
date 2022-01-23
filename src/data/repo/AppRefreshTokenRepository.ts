import { TaskTryT } from '@craigmiller160/ts-functions/types';

export type DeleteByTokenId = (tokenId: string) => TaskTryT<unknown>;

export interface AppRefreshTokenRepository {
	readonly deleteByTokenId: DeleteByTokenId;
}
