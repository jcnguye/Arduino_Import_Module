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


// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "arduino-mod" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('arduino-mod.helloWorld', copyFiles);

	context.subscriptions.push(disposable);
}



function copyFiles() {
	// open the file dialog so that the user can select a .ino file
	var inoFile: vscode.Uri
	vscode.window.showOpenDialog({
		canSelectFiles: true,
		openLabel: "Open sketch",
		filters: {
			'Arduino Sketch': ['ino']
		}
	}).then(file => {
		if(file) {
			inoFile = file[0]
			vscode.window.showInformationMessage('I have your file: ' + inoFile.toString());
			// ask user to select a save destination folder
			vscode.window.showSaveDialog({
				saveLabel: "Create project folder here"
			}).then(folder => {
				if(folder) {
					vscode.window.showInformationMessage('File ' + inoFile.toString() + " is being saved at " + folder.toString());
				} else {
					vscode.window.showInformationMessage('No save folder was selected. Re-run the command to try again.');
				}
			})
		} else {
			vscode.window.showInformationMessage('No file was selected! Re-run the command to try again.');
		}
	})
}


// This method is called when your extension is deactivated
export function deactivate() {}
