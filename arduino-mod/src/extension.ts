// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';
import * as readline from 'readline';
import * as fs from 'fs';
import { execSync } from 'child_process';
import * as parser from './parser';
import { MainPanel } from "./panels/MainPanel";
import { Board } from './board';
import Cmaker from './cmaker';
import * as importproj from './importproj';
import * as os from 'os';


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
 * Returns an iterable object containing the absolute name of all files in all given directories,
 * including files in subfolders.
 * @param directoryPaths - an array of absolute paths to directories
 * @returns Iterable object with the absolute name of all files in a directory
 */
function* getAllFilePathsArray(directoryPaths: string[]): Iterable<string> {
	for (const dir of directoryPaths) {
		yield* getAllFilePaths(dir);
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
        const regex = /#include <([^>]+\.h)>/g;

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
 * @param appendString Optional. String to add to the beginning of the copied file. 
 */
function copyFile(sourcePath: string, destinationDirectory: string, newFileName?: string, appendString?: string) {
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

    if (appendString) {
        output.write(appendString);
    }
	//copy file
	input.pipe(output);
}

/**
 * Checks if folder exists. If so, recursively copies folder & contents to destination
 * @param source 
 * @param destination 
 * @returns 
 */
function copyFolder(source: string, destination: string) {
    if (fs.existsSync(source)) {
        if (!fs.existsSync(destination)) {
            fs.mkdirSync(destination);
        }
        // Copy each file inside the folder
        fs.readdirSync(source).forEach((itemName) => {
            const itemPath = path.join(source, itemName);
            const targetPath = path.join(destination, itemName);

            if (fs.lstatSync(itemPath).isDirectory()) {
                copyFolder(itemPath, targetPath);
            } else {
                fs.copyFileSync(itemPath, targetPath);
            }
        });      
    }
}

// Helper for copyLibraries
async function copyThridPartyLibraries(libList: string[], targetDirectory: string, libPath: string, isCoreLib: boolean): Promise<boolean> {
    let result = false;
    const allFiles = getAllFilePaths(libPath);
    
    //copying files to new directory if their directory name matches .ino file
    for await(const scanned of allFiles) {
        let directories = scanned.split('\\');
        // eslint-disable-next-line @typescript-eslint/naming-convention
        let file = directories[directories.length - 1].split('.');
        if(file.length >= 1 && libList.includes(file[0])) {
            if(file[1] === 'cpp' || (file[1] === 'c' || (file[1] === 'h' || (file[1] === 'hpp')))) {
                copyFile(scanned, targetDirectory);

                //Check if utilities file exists. If so, copy it. Only applicable for core libraries 
                if (directories.includes("src") && isCoreLib) {
                    result = true;
                    const folderName = 'utility';
                    const utilPath = scanned.replace(directories[directories.length - 1], folderName);
                    copyFolder(utilPath, path.join(targetDirectory, folderName));
                }
            }
        } 
    }
    return result;
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
async function copyLibraries(libDirectory: string, coreDirectory:string, sketchFile: string, board: Board): Promise<boolean> {
    let result = false;
    let libraries = undefined;
    try {
        libraries = await getAllLibraries(sketchFile);
    } catch (error) {
        console.error(error);
        return result;
    }
	
	const coreLibPath = board.getPathToCoreLibs();
    result = await copyThridPartyLibraries(libraries, coreDirectory, coreLibPath, true);

    const home = os.homedir();
    const docLibPath = path.join(home, "Documents", "Arduino", "libraries");
    await copyThridPartyLibraries(libraries, libDirectory, docLibPath, false);

    // If the list of libraries contains any Adafruit library, copy over BusIO. Hardcoded per Bob Martin.
    if (libraries.some((element) => element.includes("Adafruit"))) {
        const adaLibPath = path.join(docLibPath, "Adafruit_BusIO");
        const adaFiles = getAllFilePaths(adaLibPath);
        for(const file of adaFiles) {
            if (file.endsWith('.h') || file.endsWith('.cpp')) {
                copyFile(file, libDirectory);
            }
        }      
    }

    return result;

}

function createSrcHeader(inputFile: string, outputDir: string) {
    const fileContents = fs.readFileSync(inputFile, 'utf8');
    const functionRegex = /([\n][\w]+\s+[\w:]+\s*\(.*\)\s*(?:const)?)\s*(?:{|\n{)/g;
    // /([\w]+\s+[\w:]+\s*\(.*\)\s*(?:const)?)\s*(?:{|\n{)/g;
    const functionNames: string[] = [];
    let match;
    while ((match = functionRegex.exec(fileContents)) !== null) {
        const functionName = match[1].trim();
        if (!functionName.includes(':')) { // ignore class member functions
            functionNames.push(functionName);
        }
    }
    
    const headerFileName = path.basename(inputFile).replace('.ino', '.h');
    const headerFilePath = path.join(outputDir, headerFileName);
    const headerContent = '#include <Arduino.h>\n' + functionNames.map(declaration => `${declaration};`).join('\n');

    fs.writeFileSync(headerFilePath, headerContent, 'utf8');
}


// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	
    const arduinoImportCommand = vscode.commands.registerCommand("arduino-mod.arduinoImport", () => {
      MainPanel.render(context.extensionUri);
    });
    context.subscriptions.push(arduinoImportCommand);
}


export async function startImport(sketchPath: string, destDir: string, board: Board, debuggingOptimization: boolean) {
    vscode.window.showInformationMessage("Starting import.");
    //rename .ino as .cpp and copy it to the destination directory
    const file = path.basename(sketchPath);
    const cFile = file.replace(/\.ino$/, '.cpp');
    console.log("Starting to copy sketch file....");
    const srcPath = path.join(destDir, 'src');
    if (!fs.existsSync(srcPath)) {
        fs.mkdirSync(srcPath);
    }
    copyFile(sketchPath, srcPath, cFile, '#include <Arduino.h>\n#include "'+ cFile.replace('.cpp', '.h') + '"\n');
    createSrcHeader(sketchPath, srcPath);

    //create core folder in destination directory & copy appropriate code device library source files
    const corePath = path.join(destDir, 'core');
    if (!fs.existsSync(corePath)) {
        fs.mkdirSync(corePath);
    }
    console.log("Starting to copy code device library files...");
    importproj.copyDirectoriesPaired(board.getCorePaths(), destDir);
    fs.renameSync(path.join(destDir, "core", "wiring_pulse.S"), path.join(destDir, "core", "wiring_pulse_asm.S"));
    console.log("Core import complete");
   
    //create lib folder in destination directory and copy all librarires included in sketch file
    const libPath = path.join(destDir, 'lib');
    if (!fs.existsSync(libPath)) {
        fs.mkdirSync(libPath);
    }
    console.log("Starting to copy libraries...");
    const includeUtilitiesDir = await copyLibraries(libPath, corePath, sketchPath, board);
    console.log("Library import complete");

    const cmake= new Cmaker(board, debuggingOptimization);
    cmake.setProjectDirectory(destDir);
    cmake.setProjectName(cFile.replace(".cpp", ""));
    cmake.setSourceName('src/' + cFile);
    cmake.setCompilerFlags(await parser.getAllFlags(board));
    cmake.setIncludeUtilitiesDir(includeUtilitiesDir);
    cmake.build();


    //create ouptput directory
    const outputPath = path.join(destDir, 'output');
    if (!fs.existsSync(outputPath)) {
        fs.mkdirSync(outputPath);
    }
    vscode.window.showInformationMessage("Import complete! Building project...");
    try {
        execSync('cmake -G "Unix Makefiles"', {cwd: destDir});
        execSync('make', {cwd: destDir});    
    } catch (error) {
        console.error('Error:', error);
        vscode.window.showInformationMessage("Error using CMake. See console for more info.");
    }
    
    try {
        const command = process.platform === 'win32' ? `start "" "${outputPath}"` : `open "${outputPath}"`;
        execSync(command);
    } catch (error) {
        console.error(error);
        vscode.window.showInformationMessage("Error opening project directory. See console for more info.");
    }
    
}




// This method is called when your extension is deactivated
export function deactivate() {}
