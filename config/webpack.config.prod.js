'use strict';
const path = require('path');
const fs = require('fs');
const DtsWebpackBundler = require('dts-webpack-bundler');
const DtsBundleWebpack = require('dts-bundle-webpack')
const appDirectory = fs.realpathSync(process.cwd());
const resolveApp = relativePath => path.resolve(appDirectory, relativePath);
module.exports = {
	entry: resolveApp('src/WidgetFramework/index.ts'), //'../src/WidgetHost.tsx',
	output: {
		library: "widgetfw",
		//pathinfo: true,
		path: path.resolve('build', 'dist'),
		filename: 'widgetfw.js'
	},
	resolve: {
		extensions: ['.webpack.js', '.web.js', '.ts', '.js', '.tsx']
	},
	module: {
		loaders: [
			{ test: /\.(ts|tsx)$/, loader: 'ts-loader' }
		]
	},
	externals: {
		'react': 'React',
		'react-dom': 'ReactDOM',
		'rxjs': 'Rxjs'
	},
	plugins: [
		// new DtsWebpackBundler({
		// 	libName: 'widgetfw',
		// 	typingsDir: path.resolve(process.cwd(), 'build/dist/build/WidgetFramework'),
		// 	outputDir: path.resolve(process.cwd(), 'build'),
		// 	deleteSource: false // deletes the typings folder after bundling it.
		// })
		new DtsBundleWebpack({
			name:"widgetfw",
			main: 'build/dist/build/WidgetFramework/index.d.ts',
			baseDir: 'build/dist/build/WidgetFramework',
			out: 'index.d.ts'
		})
	]
}