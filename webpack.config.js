const path = require('path');
const { IgnorePlugin } = require('webpack');
// const nodeExternals = require('webpack-node-externals');

module.exports = {
	entry: path.join(process.cwd(), 'src', 'index.ts'),
	mode: process.env.NODE_ENV,
	target: 'node',
	output: {
		path: path.join(process.cwd(), 'build'),
		filename: 'index.js'
	},
	resolve: {
		modules: [
			path.resolve(process.cwd(), 'src'),
			path.resolve(process.cwd(), 'node_modules')
		],
		extensions: ['.ts', '.js', '.json']
	},
	module: {
		rules: [
			{
				test: /\.ts$/,
				use: ['ts-loader']
			}
		]
	},
	// TODO label these as the optional mongodb dependencies
	externals: [
		'mongodb-client-encryption',
		'aws4',
		'bson-ext',
		'snappy',
		'kerberos'
	],
	// TODO same here, for mongodb issues
	plugins: [
		new IgnorePlugin({
			resourceRegExp: /snappy/,
			contextRegExp: /mongodb/
		})
	]
};
