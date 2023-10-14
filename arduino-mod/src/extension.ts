// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

/**
     * Returns an iterable object containing the absolute name of all files in a given directory,
	 * including files in subfolders. 
     * @param directoryPath - the absolute path to the directory
	 * @returns Iterable object with the absolute name of all files in a directory
     */
function* getAllFilePaths(directoryPath: string): Iterable<string> {
    const files = fs.readdirSync(directoryPath);

    for (const file of files) {
        const filePath = path.join(directoryPath, file);
        const stats = fs.statSync(filePath);

        if (stats.isFile()) {
            yield filePath; 
        } else if (stats.isDirectory()) {
            yield* getAllFilePaths(filePath);
        }
    }
}

/**
 * Copies a file into a given directory location.
 * @param sourcePath Path to the file to be copied
 * @param destinationDirectory Path to the directory the file should be copied into
 * @param newFileName Optional. Rename the copy of the file. Can be used to rename .ino to .cpp, but doesn't change the 
 * contents of the file. 
 */
function copyFile(sourcePath: string, destinationDirectory: string, newFileName?: string) {
	var fileName;
	if (newFileName) {
		fileName = newFileName;
	} else {
		fileName = path.basename(sourcePath);
	}
	const destinationPath = path.join(destinationDirectory, fileName);
	const input = fs.createReadStream(sourcePath);
	const output = fs.createWriteStream(destinationPath);
	//verify read & write streams
	input.on('error', (err) => {
		console.error('Error reading file: ', sourcePath);
	});
	output.on('error', (err) => {
		console.error('Error writing to file: ', destinationPath);
	});
	//copy file
	input.pipe(output);
}


// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "arduino-mod" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('arduino-mod.helloWorld', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from Arduino_Mod!');
		
		/* testing for the library copier
		if(process.platform == "win32") {
			librariesCopy("%HOMEPATH%/test")
		} else {
			librariesCopy("~/test")
		}
		*/
		
	});

	context.subscriptions.push(disposable);
}



/**
 * This copies all of the libraries from Arduino to the user's new local project directory (into the "core" folder
 * @param dest the user's project directory (/core/libraries will be added)
 */
function librariesCopy(dest: string) {
	// path info: https://support.arduino.cc/hc/en-us/articles/360018448279-Open-the-Arduino15-folder
	let srcPath = "/Arduino15/packages/DxCore/hardware/megaavr/*/libraries/" // using * because Arduino IDE will only install one version at a time.
	let runCmd = ""
	dest = dest + "/core/libraries"
	if(process.platform == "win32") {
		srcPath = "%LocalAppData%" + srcPath
		runCmd = "ROBOCOPY /CREATE /E"
		srcPath = srcPath.replace("*", "1.5.10") // for some reason windows doesn't like this, so we have to hardcode the path in anyways
	} else if(process.platform == "darwin") {
		srcPath = "~/Library" + srcPath
		runCmd = "mkdir -p " + dest + "&& cp -rc"
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


// This method is called when your extension is deactivated
export function deactivate() {}
