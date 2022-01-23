import { DeleteByTokenId } from '../AppRefreshTokenRepository';
import * as TaskTry from '@craigmiller160/ts-functions/TaskTry';
import { AppRefreshTokenModel } from '../../../mongo/models/AppRefreshTokenModel';

export const deleteByTokenId: DeleteByTokenId = (tokenId) =>
	TaskTry.tryCatch(() => AppRefreshTokenModel.deleteOne({ tokenId }).exec());
