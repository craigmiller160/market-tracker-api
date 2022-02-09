const path = require('path');
const { IgnorePlugin } = require('webpack');
const nodeExternals = require('webpack-node-externals');
const { merge } = require('webpack-merge');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const baseConfig = {
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
	externals: [nodeExternals()],
	plugins: [
		new CleanWebpackPlugin(),
		new CopyWebpackPlugin({
			patterns: [
				{
					from: path.resolve(process.cwd(), 'src', 'cert'),
					to: path.resolve(process.cwd(), 'build'),
					noErrorOnMissing: true
				}
			]
		})
	]
};

const mongodbDependencyIssueConfig = {
	externals: [
		'mongodb-client-encryption',
		'aws4',
		'bson-ext',
		'snappy',
		'kerberos'
	],
	plugins: [
		new IgnorePlugin({
			resourceRegExp: /snappy/,
			contextRegExp: /mongodb/
		})
	]
};

module.exports = merge(baseConfig, mongodbDependencyIssueConfig);
