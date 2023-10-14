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

	const arduinoImportTreeDataProvider = new ArduinoImportTreeDataProvider();
    vscode.window.registerTreeDataProvider('arduinoImportTree', arduinoImportTreeDataProvider);
    vscode.commands.registerCommand('arduinoImportTree.selectSketchFile', () => {
        selectSketchFile();
    });
    vscode.commands.registerCommand('arduinoImportTree.selectDestinationDirectory', () => {
        selectDestinationDirectory();
    });
    vscode.commands.registerCommand('arduinoImportTree.selectBoard', () => {
        selectBoard();
    });
}

// This method is called when your extension is deactivated
export function deactivate() {}

class ArduinoImportTreeDataProvider implements vscode.TreeDataProvider<TreeItem> {
    getTreeItem(element: TreeItem): vscode.TreeItem {
        return element;
    }
  
    getChildren(element?: TreeItem): Thenable<TreeItem[]> {
        if (element) {
            return Promise.resolve([]);
        } else {
            return Promise.resolve([
                new TreeItem("Select Arduino Sketch File", vscode.TreeItemCollapsibleState.None, {
                    command: 'arduinoImportTree.selectSketchFile',
                    title: 'Select Arduino Sketch File'
                }),
                new TreeItem("Select Destination Directory", vscode.TreeItemCollapsibleState.None, {
                    command: 'arduinoImportTree.selectDestinationDirectory',
                    title: 'Select Destination Directory'
                }),
                new TreeItem("Select Arduino Board", vscode.TreeItemCollapsibleState.None, {
                    command: 'arduinoImportTree.selectBoard',
                    title: 'Select Arduino Board'
                }),
            ]);
        }
    }
}

class TreeItem extends vscode.TreeItem {
    constructor(
        label: string,
        collapsibleState: vscode.TreeItemCollapsibleState,
        command?: vscode.Command
    ) 
    {
        super(label, collapsibleState);
        if (command) {
            this.command = command;
        }
    }
}
        
async function selectSketchFile() {
    const sketchFile = await vscode.window.showOpenDialog({
        canSelectFiles: true,
        canSelectFolders: false,
        canSelectMany: false,
        filters: {
            'arduinoSketch': ['ino']
        },
        openLabel: 'Select Arduino Sketch File',
    });

    if (sketchFile && sketchFile[0]) {
        vscode.window.showInformationMessage(`Selected file: ${sketchFile[0].fsPath}`);
    }
}

async function selectDestinationDirectory() {
    const destDir = await vscode.window.showOpenDialog({
        canSelectFiles: false,
        canSelectFolders: true,
        canSelectMany: false,
        openLabel: 'Select Destination Directory',
    });
    
    if (destDir && destDir[0]) {
        vscode.window.showInformationMessage(`Selected file: ${destDir[0].fsPath}`);
    }
}

async function selectBoard() {
    const board = await vscode.window.showQuickPick([
         "UNO", "NANO", "Mega or Mega2560", "Pro or Pro Mini" //TODO - UPdate this
    ], {
        placeHolder: "Select Arduino Board",
    });

    if (board) {
        vscode.window.showInformationMessage(`Selected option: ${board}`);
    }
}