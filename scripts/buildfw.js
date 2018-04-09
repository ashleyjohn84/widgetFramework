const fs = require('fs-extra');
const path = require('path');

const appDirectory = fs.realpathSync(process.cwd());
const resolveApp = relativePath => path.resolve(appDirectory, relativePath);
(function () { build(); })();

function build()
{
	console.log("compiling widget fw...");
	let tscPath = resolveApp("node_modules\\.bin\\tsc.cmd");
	execCommand(tscPath + " --project " + resolveApp("tsconfig.json"), function (err)
	{
		if (err)
		{
			console.log(err);
			return;
		}
		console.log("completed compiling widget fw...");
		copyFilesNpmPub();
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

function execCommand(cmd, cb)
{
	// this would be way easier on a shell/bash script :P
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