import { TaskTryT } from '@craigmiller160/ts-functions/types';
import { AppRefreshToken } from '../modelTypes/AppRefreshToken';

export type DeleteByTokenId = (tokenId: string) => TaskTryT<unknown>;

export type SaveRefreshToken = (
	refreshToken: AppRefreshToken,
	existingTokenId?: string
) => TaskTryT<unknown>;

export type FindByTokenId = (
	tokenId: string
) => TaskTryT<ReadonlyArray<AppRefreshToken>>;

export interface AppRefreshTokenRepository {
	readonly deleteByTokenId: DeleteByTokenId;
	readonly saveRefreshToken: SaveRefreshToken;
	readonly findByTokenId: FindByTokenId;
}
