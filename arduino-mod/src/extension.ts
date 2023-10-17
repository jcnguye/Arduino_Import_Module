// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { UI } from "./UI";

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

	const ui = new UI();
    vscode.window.registerTreeDataProvider('arduinoImportTree', ui);
    vscode.commands.registerCommand('arduinoImportTree.selectSketchFile', () => {
        ui.selectSketchFile();
    });
    vscode.commands.registerCommand('arduinoImportTree.selectDestinationDirectory', () => {
        ui.selectDestinationDirectory();
    });
    vscode.commands.registerCommand('arduinoImportTree.selectBoard', () => {
        ui.selectBoard();
    });
    vscode.commands.registerCommand('arduinoImportTree.mainMenu', () => {
       console.log("display something")
    });
}

// This method is called when your extension is deactivated
export function deactivate() {}
