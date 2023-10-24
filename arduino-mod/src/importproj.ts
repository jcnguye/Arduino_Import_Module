import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';


/**
 * This copies all of the libraries from Arduino to the user's new local project directory (into the "core" folder
 * This command will also update the library files if they've changed since the last copy.
 * @param dest the user's project directory (/core/libraries will be added)
 */
export function librariesCopy(dest: string) {
	// path info: https://support.arduino.cc/hc/en-us/articles/360018448279-Open-the-Arduino15-folder
	// 1.5.10 must be changed if there is an update to the package
	let srcPath = "/Arduino15/packages/DxCore/hardware/megaavr/1.5.10/libraries/"
	dest = dest + "/core/libraries"
	shellCopy(srcPath, dest)
}


/**
 * This copies the compiler folder to the project core directory.
 * @param dest the user's project directory (/core/libraries will be added)
 */
export function compilerCopy(dest: string) {
	// 7.3.0-atmel3.6.1-azduino7 must be changed if there is an update to the compiler
	let srcPath = "/Arduino15/packages/DxCore/tools/avr-gcc/7.3.0-atmel3.6.1-azduino7/"
	dest = dest + "/core/compiler"
	shellCopy(srcPath, dest)
}


/**
 * This function invokes a shell to copy an entire directory from within the Arduino15 folder.
 * @param from the folder to copy
 * @param to the folder to copy to
 */
function shellCopy(from: string, to: string) {
	let runCmd = "mkdir -p " + to + " && cp -r"
	if(process.platform == "win32") {
		runCmd = "cd %LocalAppData% && ROBOCOPY /CREATE /E"
		from = "." + from
	} else if(process.platform == "darwin") {
		from = "~/Library" + from
	} else if(process.platform == "linux") {
		from = "~" + from.replace("Arduino15", ".arduino15")
	}
	const command = runCmd + " " + from + " " + to
	console.log("copy command being run: " + command)
	const { exec } = require('child_process');
	exec(command, (error: string, stdout: string, stderr: string) => {
		if(error && process.platform != "win32") {
			// windows will say the command failed, but it didn't
			// so I guess if a Windows user really has an error then they
			// can ponder why MS chose to return an error on every command.
			vscode.window.showInformationMessage('An error occured trying to copy the library files: ' + error);
			return
		}
		console.log("copy command output: " + stdout)
		if(stderr) {
			console.log("copy command err: " + stderr)
		}
	})
	
}