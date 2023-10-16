import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';


/**
 * This copies all of the libraries from Arduino to the user's new local project directory (into the "core" folder
 * @param dest the user's project directory (/core/libraries will be added)
 */
export function librariesCopy(dest: string) {
	// path info: https://support.arduino.cc/hc/en-us/articles/360018448279-Open-the-Arduino15-folder
	let srcPath = "/Arduino15/packages/DxCore/hardware/megaavr/*/libraries/" // using * because Arduino IDE will only install one version at a time.
	let runCmd = ""
	dest = dest + "/core/libraries"
	if(process.platform == "win32") {
		srcPath = "%LocalAppData%" + srcPath
		runCmd = "ROBOCOPY /CREATE /E"
		// is this still needed? srcPath = srcPath.replace("*", "1.5.10") // for some reason windows doesn't like this, so we have to hardcode the path in anyways
	} else if(process.platform == "darwin") {
		srcPath = "~/Library" + srcPath
		runCmd = "mkdir -p " + dest + "&& cp -r"
	} else if(process.platform == "linux") {
		srcPath = "~" + srcPath.replace("Arduino15", ".arduino15")
		runCmd = "mkdir -p " + dest + " && cp -r"
	}
	const command = runCmd + " " + srcPath + " " + dest
	const { exec } = require('child_process');
	exec(command, (error: string, stdout: string, stderr: string) => {
		if(error) {
			// windows will say the command failed, but it didn't
			vscode.window.showInformationMessage('An error occured trying to copy the library files: ' + error);
			return
		}
		console.log("copy command output: " + stdout)
		if(stderr) {
			console.log("copy command output: " + stderr)
		}
	})
}
