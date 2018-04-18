const fs = require('fs-extra');
const path = require('path');

const appDirectory = fs.realpathSync(process.cwd());
const resolveApp = relativePath => path.resolve(appDirectory, relativePath);
(function () { build(); })();

function build()
{
	let publishFlag = process.argv[2];
	let versionPart = process.argv[3];
	console.log("compiling widget fw...");
	let tscPath = resolveApp("node_modules\\.bin\\tsc.cmd");
	execCommand(tscPath + " --project " + resolveApp("tsconfig.json"), (err) =>
	{
		if (err)
		{
			console.log(err);
			return;
		}
		console.log("completed compiling widget fw...");
		copyFilesNpmPub();
		if (publishFlag && (publishFlag.toLowerCase() === "p" || publishFlag.toLowerCase() === "publish"))
		{
			updatePackageVersion(versionPart);
		}
	});
}

function copyFilesNpmPub()
{
	if (!fs.existsSync(resolveApp('npmpackage')))
	{
		fs.mkdirSync(resolveApp("npmpackage"));
	}
	console.log("copying files to npm publish folder...");
	fs.copySync(resolveApp("build"), resolveApp("npmpackage"));
	fs.copySync(resolveApp("src/pub.js"), resolveApp("npmpackage/pub.js"));
	fs.copySync(resolveApp("src/webpack.config.pub.js"), resolveApp("npmpackage/webpack.config.pub.js"));
	console.log("completed copying files to npm publish folder...");
}

function updatePackageVersion(versionPart)
{
	console.log("Trying to publish package to npm...");
	if (!versionPart)
	{
		console.log("Please provide a version parameter (Major/m Minor/mi Patch/p)");
		return;
	}
	let npmPackagePath = resolveApp("npmpackage");
	let versionCommand = "npm version " + getVersion(versionPart) + " --prefix " + npmPackagePath;
	let publishCommand = "npm publish --folder " + npmPackagePath;

	console.log("Incrementing package version...");
	execNpm(versionCommand, (err, stdout) =>
	{
		if (err)
		{
			console.log(err);
			return;
		}
		console.log(stdout);
		execNpm(publishCommand, (err, stdout) =>
		{
			if (err)
			{
				console.log(err);
				return;
			}
			console.log("Published package to npm...");
			console.log(stdout);
		});
	});
}

function getVersion(versionPart)
{
	switch (versionPart.toLowerCase())
	{
		case "m":
			return "major";
			break;
		case "mi":
			return "minor";
		case "p":
			return "patch";
		default:
			return "patch";
			break;
	}
}

function execNpm(npmCommand, cb)
{

	var child_process = require('child_process');
	child_process.exec(npmCommand, cb);
}

function execCommand(cmd, cb)
{
	var child_process = require('child_process');
	var parts = cmd.split(/\s+/g);
	var p = child_process.spawn(parts[0], parts.slice(1), { stdio: 'inherit' });
	p.on('exit', function (code)
	{
		var err = null;
		if (code)
		{
			err = new Error('command "' + cmd + '" exited with wrong status code "' + code + '"');
			err.code = code;
			err.cmd = cmd;
		}
		if (cb) cb(err);
	});
	p.on('error', function (err)
	{
		console.log(err);
	});
};