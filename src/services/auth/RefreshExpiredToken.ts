import * as JWT from 'jsonwebtoken';
import { AccessToken } from '../../express/TokenValidation';

// TODO I want to re-use the same token validation logic that passport uses, rather than have two different operations

export const refreshExpiredToken = (token: string | null) => {
	const result = JWT.decode(token!) as AccessToken;
	console.log('Decoded', result.userId);
};
