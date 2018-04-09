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
const vendorFilesDirectoryPath = path.join(resolveApp(outputPath), "vendor");
const widgetZipName = "widget.zip";

(function ()
{
	packageComponent();
})();

function packageComponent()
{
	const configPath = pathPrefix + 'widgetconfig.json';
	//read custom config
	readWidgetConfigFile(configPath).then((widgetConfig) =>
	{
		//create webpack config and compile
		compileWithWebpack(widgetConfig, outputPath).then(() =>
		{
			// //get the required vendor lib files
			// copyVendorLibsToOutput(widgetConfig, outputPath);\
			copyOtherAssetsToOutput(widgetConfig, outputPath);
			//create a manifest file from custom config
			createManifestFile(widgetConfig, outputPath);
			//create a zip with all the files
			createZipForUpload(outputPath).then(() =>
			{
				//convert to byte[] and send to mgmnt endpoint
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

function compileWithWebpack(widgetConfig, outputPath)
{
	let wpEnv = {
		sourceDirectory: resolveApp("src"),
		widgetConfig: widgetConfig,
		outputPath: resolveApp(outputPath)
	};
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

// function copyVendorLibsToOutput(widgetConfig, outputPath)
// {
// 	if (!fs.existsSync(vendorFilesDirectoryPath))
// 	{
// 		fs.mkdirSync(vendorFilesDirectoryPath);
// 	}
// 	for (let i = 0; i < widgetConfig.vendorFiles.length; i++)
// 	{
// 		fs.copySync(resolveApp(widgetConfig.vendorFiles[i].path), vendorFilesDirectoryPath);
// 	}
// }

function createManifestFile(widgetConfig, outputPath)
{
	var manifest = {};
	manifest["widgetId"] = widgetConfig.widgetId;
	manifest["entryPoint"] = widgetConfig.entryPoint;
	manifest["vendorFiles"] = [{ Name: "vendor_" + widgetConfig.widgetId + ".js", type: "Script" }];  //generateFilesList(vendorFilesDirectoryPath);
	manifest["files"] = generateFilesListForManifest(resolveApp(outputPath), widgetConfig);
	manifest["version"] = widgetConfig.version;
	let manifestJsonString = JSON.stringify(manifest);
	fs.writeFileSync(path.join(outputPath, 'manifest.json'), manifestJsonString);
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
			if (!files[i].endsWith(".zip"))
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

