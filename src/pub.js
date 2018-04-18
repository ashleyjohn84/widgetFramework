'use strict';
const webpack = require('webpack');
const fs = require('fs-extra');
const path = require('path');
const archiver = require("archiver");
const wpConfig = require('./webpack.config.pub');
require('es6-promise').polyfill();
require('isomorphic-fetch');

const pathPrefix = "";
const outputPath = pathPrefix + 'build';
const appDirectory = fs.realpathSync(process.cwd());
const resolveApp = relativePath => path.resolve(appDirectory, relativePath);
const widgetZipName = "widget.zip";

(function ()
{
	packageComponent();
})();

function packageComponent()
{
	const configPath = pathPrefix + 'widgetconfig.json';
	readWidgetConfigFile(configPath).then((widgetConfig) =>
	{
		let wpEnv = {
			sourceDirectory: resolveApp("src"),
			widgetConfig: widgetConfig,
			outputPath: resolveApp(outputPath)
		};
		wpEnv.externals = getExternalsForWebpack(widgetConfig);
		compileWithWebpack(wpEnv).then(() =>
		{
			copyVendorLibsToOutput(widgetConfig, outputPath);
			
			copyOtherAssetsToOutput(widgetConfig, outputPath);
			
			createManifestFile(widgetConfig, outputPath);
			
			createZipForUpload(outputPath).then(() =>
			{
				let zipBytes = generateByteArray(outputPath);
				publishToRepo(widgetConfig, zipBytes).then((response) =>
				{
					if (response.status === 200)
					{
						console.log("Widget with id '" + widgetConfig.widgetId + "' published successfully");
					}
					else
					{
						console.log("There was an error publishing the widget...");
						console.log(response.status + " : " + response.statusText);
					}
				}, (error) => { console.log(error); });
			});

		}, (webpackError) =>
			{ console.log(webpackError); });

	}, (error) =>
		{ console.log(error); });
}

function getExternalsPlugin(widgetConfig, outputPath)
{
	const HtmlWebpackExternalsPlugin = require('html-webpack-externals-plugin');
	return [new HtmlWebpackExternalsPlugin({
		outputPath: resolveApp(outputPath),
		// See API section
		externals: getExternalsForPlugin(widgetConfig)
	})];
}

function getExternalsForPlugin(widgetConfig)
{
	let externals = [];
	for (let i = 0; i < widgetConfig.externals.length; i++)
	{
		externals.push(widgetConfig.externals[i]);
	}
	return externals;
}

function getExternalsForWebpack(widgetconfig)
{
	let externals = {};
	externals["react"] = "React";
	externals["react-dom"] = "ReactDOM";
	externals["rxjs"] = "Rxjs";
	// externals["rxjs/Subject"] = "Subject";
	// externals["rxjs/operators"] = "filter";
	return externals;
}

function readWidgetConfigFile(configPath)
{
	return new Promise((resolve, reject) =>
	{
		let configPathresolved = resolveApp(configPath);
		fs.readFile(configPathresolved, 'utf-8', function (err, textData)
		{
			if (err)
			{
				console.log(err);
				return reject(err);
			}
			const widgetConfig = JSON.parse(textData);
			return resolve(widgetConfig);
		});
	});

}

function compileWithWebpack(wpEnv)
{
	let compiler = webpack(wpConfig(wpEnv));
	return new Promise((resolve, reject) =>
	{
		compiler.run((err, stats) =>
		{
			if (err)
			{
				console.log(err);
				return reject(err);
			}
			return resolve();
		});
	});

}

function copyOtherAssetsToOutput(widgetConfig, outputPath)
{
	for (let i = 0; i < widgetConfig.files.length; i++)
	{
		if (widgetConfig.files[i].type !== "Script")
		{
			fs.copySync(widgetConfig.files[i].path, path.join(outputPath, path.basename(widgetConfig.files[i].path)));
		}
	}
}

function copyVendorLibsToOutput(widgetConfig, outputPath)
{
	for (let i = 0; i < widgetConfig.externals.length; i++)
	{
		fs.copySync(path.join(outputPath, widgetConfig.externals[i].module, widgetConfig.externals[i].module + ".js"), path.join(outputPath, widgetConfig.externals[i].module + ".js"));
	}
	// if (!fs.existsSync(vendorFilesDirectoryPath))
	// {
	// 	fs.mkdirSync(vendorFilesDirectoryPath);
	// }
	// for (let i = 0; i < widgetConfig.vendorFiles.length; i++)
	// {
	// 	fs.copySync(resolveApp(widgetConfig.vendorFiles[i].path), vendorFilesDirectoryPath);
	// }
}

function createManifestFile(widgetConfig, outputPath)
{
	var manifest = {};
	manifest["widgetId"] = widgetConfig.widgetId;
	manifest["entryPoint"] = widgetConfig.entryPoint;
	manifest["vendorFiles"] = getVendorFilesListForManifest(widgetConfig); //[{ Name: "vendor_" + widgetConfig.widgetId + ".js", type: "Script" }];  //generateFilesList(vendorFilesDirectoryPath);
	manifest["files"] = generateFilesListForManifest(resolveApp(outputPath), widgetConfig);
	manifest["version"] = widgetConfig.version;
	let manifestJsonString = JSON.stringify(manifest, null, "\t");
	fs.writeFileSync(path.join(outputPath, 'manifest.json'), manifestJsonString);
}

function getVendorFilesListForManifest(widgetConfig)
{
	let vendorFiles = [];
	for (let i = 0; i < widgetConfig.externals.length; i++)
	{
		vendorFiles = vendorFiles.concat(widgetConfig.externals[i].module + ".js");
	}
	return vendorFiles;
}

function generateFilesListForManifest(dirPath, widgetConfig)
{
	let fileList = [];
	let configfilesList = widgetConfig.files;
	let files = fs.readdirSync(dirPath);

	for (let i = 0; i < files.length; i++)
	{
		if (!files[i].startsWith("vendor_"))
		{
			for (let j = 0; j < configfilesList.length; j++)
			{
				if (files[i] === path.basename(configfilesList[j].path))
				{
					fileList.push({ name: files[i], type: configfilesList[j].type });
				}
			}
		}
	}
	//the entire widget file will be packed by webpack as [WidgetId].js
	fileList.push({ name: widgetConfig.widgetId + ".js", type: "Script" });
	return fileList;
}

function createZipForUpload(outputPath)
{
	return new Promise((resolve, reject) =>
	{
		var output = fs.createWriteStream(path.join(outputPath, widgetZipName));
		var archive = archiver('zip', {
			zlib: { level: 9 }
		});
		archive.on('error', function (err)
		{
			reject(err);
		});
		output.on('close', function ()
		{
			resolve();
		});
		archive.pipe(output);
		let files = fs.readdirSync(resolveApp(outputPath));

		for (let i = 0; i < files.length; i++)
		{
			if (files[i].endsWith(".js") || files[i].endsWith(".css") || files[i].endsWith(".json"))
			{
				archive.file(path.join(outputPath, files[i]), { name: files[i] });
			}
		}
		archive.finalize();
	});
}

function generateByteArray(filePath)
{
	let zipPath = path.join(resolveApp(filePath), widgetZipName);
	const fileData = fs.readFileSync(zipPath).toString("base64");
	return fileData;
}

function publishToRepo(widgetConfig, zipBytes)
{
	return fetch(widgetConfig.widgetRepoUrl, {
		body: JSON.stringify(zipBytes),
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		}
	});
}

