const path = require('path');

module.exports = {
	entry: path.join(process.cwd(), 'src', 'index.ts'),
	mode: process.env.NODE_ENV,
	target: 'node',
	output: {
		path: path.join(process.cwd(), 'build'),
		filename: 'index.js'
	},
	resolve: {
		extensions: ['.ts', '.js']
	},
	module: {
		rules: [
			{
				test: /\.ts$/,
				use: [
					'ts-loader'
				]
			}
		]
	}
};
