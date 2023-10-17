// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

import * as path from 'path';
import * as readline from 'readline';
import * as fs from 'fs';

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
 * This function scans a file's include statements to retrive
 * the name of all the required libraries. 
 * 
 * Note that reading a file is an asyncronous process, 
 * meaning the function that calls it must be asynchronous.
 * 
 * @param filepath : .ino or .c sketch document
 * @returns Promise String
 */
function getAllLibraries(filepath: string): Promise<string[]> {
    return new Promise<string[]>((resolve, reject) => {
        let libraries: string[] = [];

        const fileStream = fs.createReadStream(filepath);

        const rl = readline.createInterface({
            input: fileStream,
            crlfDelay: Infinity,
        });

        //regex for #include <X.h>
        const regex = /#include <([^>]+\.h)>/g

        //iterating line-by-line through filestream
        rl.on('line', (line) => {
            const matches = line.match(regex);

            if(matches) {
                libraries.push(line.substring(10, line.length - 3));
            }
            else if(line.includes("void setup()")) {
                rl.close();
            }
            
        });

        //retrieve promised array of strings
        rl.on('close', () => {
            resolve(libraries);
        });

        rl.on('error', (err) => {
            reject(err);
        });

    });
}

 /* Copies a file into a given directory location.
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

/**
 * This function scans the the Arduino/libraries folder for any source files that
 * are imported within the main sketch file.
 * 
 * Note that this function assumes that the directory it is copying files
 * to already exists.
 * 
 * @param newDirectory : Directory to copy files to
 * @param sketchFile : .ino file with "#includes <lib.h>"
 */
async function copyLibraries(newDirectory: string, sketchFile: string) {
    //getting file paths
    const localAppData = process.env.LOCALAPPDATA;
    const libraryFilePath = path.join(localAppData!, "Arduino15", "libraries");
    let libraries = undefined;
    try {
        libraries = await getAllLibraries(sketchFile);
    } catch (error) {
        console.error(error);
        return;
    }

    const iterable = getAllFilePaths(libraryFilePath);
    
    //copying files to new directory if their directory name matches .ino file
    for await(const scanned of iterable) {
        let directories = scanned.split('\\');
        let file_type = directories[directories.length - 1].split('.');
        if(file_type.length >= 1 && libraries.includes(directories[7])) {
            if(file_type[1] === 'cpp' || (file_type[1] === 'c' || (file_type[1] === 'h' || (file_type[1] === 'hpp')))) {
                copyFile(scanned,newDirectory);
            }
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
	let disposable = vscode.commands.registerCommand('arduino-mod.helloWorld', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from Arduino_Mod!');
	});

    /**
     * Function to test library copying. The exact location to "example.ino" 
     * will likely need to be updated to your exact filepath.
     */
    let libraries = vscode.commands.registerCommand('arduino-mod.libraryCopier', () => {
        //copying to download folder for example
        const userProfile = process.env.USERPROFILE;
        const downloadPath = path.join(userProfile!, 'Downloads','Arduino');
        const sketchPath = "example.ino";

        //making Arduino folder in download folder
        if (!fs.existsSync(downloadPath)) {
            fs.mkdirSync(downloadPath);
        }
        
        
        console.log("Copying library files to ", downloadPath);
        console.log("Starting 'Copying Libraries' Command");

        copyLibraries(downloadPath, sketchPath);

        console.log("Finished 'Copying LIbraries' Command");
    });

	context.subscriptions.push(disposable);
    context.subscriptions.push(libraries);
}

// This method is called when your extension is deactivated
export function deactivate() {}
