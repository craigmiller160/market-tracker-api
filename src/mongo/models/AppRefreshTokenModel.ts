import { model, Schema } from 'mongoose';

export interface AppRefreshToken {
	tokenId: string;
	refreshToken: string;
}

const appRefreshTokenSchema = new Schema<AppRefreshToken>({
	tokenId: {
		type: String,
		required: true
	},
	refreshToken: {
		type: String,
		required: true
	}
});

export const AppRefreshTokenModel = model<AppRefreshToken>(
	'app_refresh_token',
	appRefreshTokenSchema
);
export type AppRefreshTokenModelType = typeof AppRefreshTokenModel;

const exampleModel = new AppRefreshTokenModel();
export type AppRefreshTokenModelInstanceType = typeof exampleModel;

export const appRefreshTokenToModel = (
	appRefreshToken: AppRefreshToken
): AppRefreshTokenModelInstanceType =>
	new AppRefreshTokenModel(appRefreshToken);
