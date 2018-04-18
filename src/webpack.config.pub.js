const autoprefixer = require('autoprefixer');
const fs = require('fs-extra');
const path = require('path');
const webpack = require('webpack');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

const appDirectory = fs.realpathSync(process.cwd());
const resolveApp = relativePath => path.resolve(appDirectory, relativePath);

const extractTextPluginOptions = {};

module.exports = function (env)
{
	config = {
		entry: createEntryNode(env.widgetConfig),
		output: {
			library: env.widgetConfig.entryPoint,
			path: env.outputPath,
			filename: "[name].js",
			//libraryTarget:"var"
		},
		resolve: {
			extensions: [".js", ".ts", ".tsx"]
		},
		module: {
			rules: [{
				test: /\.(ts|tsx)$/,
				include: env.sourceDirectory,
				use: [
					{
						loader: require.resolve('ts-loader'),
						options: {
							// disable type checker - we will use it in fork plugin
							transpileOnly: false,
						},
					},
				],
			},
			{
				test: /\.css$/,
				loader: ExtractTextPlugin.extract(
					Object.assign(
						{
							fallback: {
								loader: require.resolve('style-loader'),
								options: {
									hmr: false,
								},
							},
							use: [
								{
									loader: require.resolve('css-loader'),
									options: {
										importLoaders: 1,
										minimize: true,
										sourceMap: false,
									},
								},
								{
									loader: require.resolve('postcss-loader'),
									options: {
										// Necessary for external CSS imports to work
										// https://github.com/facebookincubator/create-react-app/issues/2677
										ident: 'postcss',
										plugins: () => [
											require('postcss-flexbugs-fixes'),
											autoprefixer({
												browsers: [
													'>1%',
													'last 4 versions',
													'Firefox ESR',
													'not ie < 9', // React doesn't support IE8 anyway
												],
												flexbox: 'no-2009',
											}),
										],
									},
								},
							],
						},
						extractTextPluginOptions
					)
				),
				// Note: this won't work without `new ExtractTextPlugin()` in `plugins`.
			}
			]
		},
		externals: env.externals
	}
	return config;
}

function createEntryNode(customConfig)
{
	let entryPoint = {};
	entryPoint[customConfig.widgetId] = resolveApp(customConfig.files[0].path);
	return entryPoint;
}