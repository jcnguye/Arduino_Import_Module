import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { Board } from './boardsInfo';


/**
 * This copies all of the libraries from Arduino to the user's new local project directory (into the "core" folder
 * This command will also update the library files if they've changed since the last copy.
 * @param dest the user's project directory (/core/libraries will be added)
 */
export function librariesCopy(dest: string) {
	// path info: https://support.arduino.cc/hc/en-us/articles/360018448279-Open-the-Arduino15-folder
	// 1.5.10 must be changed if there is an update to the package
	let srcPath = "/Arduino15/packages/DxCore/hardware/megaavr/1.5.10/libraries/";
	dest = dest + "/core/libraries";
	shellCopy(srcPath, dest);
}


/**
 * This copies the compiler folder to the project core directory.
 * @param dest the user's project directory (/core/libraries will be added)
 */
export function compilerCopy(dest: string) {
	// 7.3.0-atmel3.6.1-azduino7 must be changed if there is an update to the compiler
	let srcPath = "/Arduino15/packages/DxCore/tools/avr-gcc/7.3.0-atmel3.6.1-azduino7/";
	dest = dest + "/core/compiler";
	shellCopy(srcPath, dest);
}


/**
 * This function invokes a shell to copy an entire directory from within the Arduino15 folder.
 * @param from the folder to copy
 * @param to the folder to copy to
 */
function shellCopy(from: string, to: string) {
	let runCmd = "mkdir -p " + to + " && cp -r";
	if(process.platform === "win32") {
		runCmd = "cd %LocalAppData% && ROBOCOPY /CREATE /E";
		from = "." + from;
	} else if(process.platform === "darwin") {
		from = "~/Library" + from;
	} else if(process.platform === "linux") {
		from = "~" + from.replace("Arduino15", ".arduino15");
	}
	const command = runCmd + " " + from + " " + to;
	console.log("copy command being run: " + command);
	const { exec } = require('child_process');
	exec(command, (error: string, stdout: string, stderr: string) => {
		if(error && process.platform !== "win32") {
			// windows will say the command failed, but it didn't
			// so I guess if a Windows user really has an error then they
			// can ponder why MS chose to return an error on every command.
			vscode.window.showInformationMessage('An error occured trying to copy the library files: ' + error);
			return;
		}
		console.log("copy command output: " + stdout);
		if(stderr) {
			console.log("copy command err: " + stderr);
		}
	});
	
}

/** Recursively copies a directory to a specified location
 * 
 * @param src The directory to copy
 * @param dest The destination location
 */
export function copyDirectory(src: string, dest: string): void {
	// Create destination directory if it doesn't exist
	if (!fs.existsSync(dest)) {
	  fs.mkdirSync(dest);
	}
  
	// Read the source directory
	const files = fs.readdirSync(src);
  
	// Copy each file to the destination directory
	files.forEach(file => {
	  const srcPath = path.join(src, file);
	  const destPath = path.join(dest, file);
	  if (fs.lstatSync(srcPath).isDirectory()) {
		// Recursively copy subdirectories
		copyDirectory(srcPath, destPath);
	  } else {
		// Copy files
		fs.copyFileSync(srcPath, destPath);
	  }
	});
}

/**
 * Copies the most recent version of the AVR-GCC compiler that a user has downloaded
 * 
 * @param dest Destination directory where the AVR-GCC compiler should be copied to
 */
export function copyAvrGcc(dest: string, board: Board){
	const localAppData = process.env.LOCALAPPDATA;
	if (localAppData) {
		const compilerPath = board.getPathToCompiler();
		const version = mostRecentDirectory(compilerPath);
		const finalCompilerPath = path.join(compilerPath, version);
		dest = path.join(dest, "compiler");
		copyDirectory(finalCompilerPath, dest);
	}

}

/**
 * Helper function to determine which directory inside a given directory is the most recent
 * based on the modified stamp
 * @param dirPath Path to the directory that should be investigated
 * @returns The name of the directory inside dirPath that was most recently updated
 */
function mostRecentDirectory(dirPath: string): string {

   	const directories = fs.readdirSync(dirPath, { withFileTypes: true });
    const subdirectories = directories.filter((dirent) => dirent.isDirectory());
    const mostRecentDirectory = subdirectories.reduce((prev, current) => {
    	const prevPath = `${path}/${prev.name}`;
    	const currentPath = `${path}/${current.name}`;

    	const prevStat = fs.statSync(prevPath);
    	const currentStat = fs.statSync(currentPath);

    	return prevStat.mtimeMs > currentStat.mtimeMs ? prev : current;
    });
    return mostRecentDirectory.name;

}

