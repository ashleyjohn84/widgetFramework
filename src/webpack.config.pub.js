const fs = require('fs-extra');
const path = require('path');
const webpack = require('webpack');

const appDirectory = fs.realpathSync(process.cwd());
const resolveApp = relativePath => path.resolve(appDirectory, relativePath);

module.exports = function (env)
{
	config = {
		entry: createEntryNode(env.widgetConfig),
		output: {
			library: env.widgetConfig.entryPoint,
			path: env.outputPath,
			filename: "[name].js"
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
			}]
		},
		externals: {
			'react': 'React',
			'react-dom': 'ReactDOM',
			'rxjs': 'Rxjs'
		},
		plugins: [
			new webpack.optimize.CommonsChunkPlugin({
				name: "vendor_" + env.widgetConfig.widgetId,
				minChunks: Infinity
			})
		]
	}
	return config;
}

function createEntryNode(customConfig)
{
	let entryPoint = {};
	let vendorModules = [];
	// for (let i = 0; i < customConfig.files.length; i++)
	// {
	// 	if (customConfig.files[i].type === 'Script')
	// 	{
	// 		entryPoint[customConfig.widgetId] = resolveApp(customConfig.files[i].path)
	// 	}
	// }
	entryPoint[customConfig.widgetId] = resolveApp(customConfig.files[0].path);
	for (let i = 0; i < customConfig.vendorFiles.length; i++)
	{
		vendorModules = vendorModules.concat(customConfig.vendorFiles[i]);
	}
	entryPoint["vendor_" + customConfig.widgetId] = vendorModules;
	// console.log(JSON.stringify(entryPoint));
	return entryPoint;
}