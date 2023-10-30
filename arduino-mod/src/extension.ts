// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';
import { UI } from "./UI";
import * as readline from 'readline';
import * as fs from 'fs';


/**
 * Gets the compiler flags out of the platform.txt file
 */
async function getCompileFlags() {
    // get platform.txt file to parse
    const filePath = await vscode.window.showInputBox({
        placeHolder: "Compiler Flags",
        prompt: "Enter path to 'platform.txt' file",
    });
    if (filePath){
        // make sure file is valid
        var flagArr = await parsePlatform(filePath);
        var flagStr = "";
        for (var i = 0; i < flagArr.length; i++) flagStr += flagArr[i] + ',\n';
        vscode.window.showInformationMessage(flagStr, {modal: true});
    } else {
        vscode.window.showInformationMessage("Not a valid path or directory does not contain platform.txt file.");
    }
}
/**
 * Parses the platform.txt file and pulls out all the compiler flags
 * @param filePath - directory to platform.txt file
 * @returns Array of all the compiler flags
 */
async function parsePlatform(filePath:string) {
    var flagArr: string[] = [];
    try {
        ////// separate text file into readable lines
        const lines: string[] = [];
        const fileStream = fs.createReadStream(path.join(filePath, 'platform.txt'));
        const rl = readline.createInterface({
            input: fileStream,
            crlfDelay: Infinity,
        });
        for await (const line of rl) {
            lines.push(line);
        }
        ////// get all the compiler flag lines
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i].substring(0, lines[i].indexOf('='));
            if (line.includes("compiler.") || line.includes(".flags") || line.includes("recipe.") || line.includes("build")) {
                flagArr.push(lines[i]);
            }
        }
    } catch (error) {
        flagArr = ["Error occurred while reading the file."];
    }
    return flagArr;
}

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

/**
 * Parses the passed in boards.txt file and creates a map of
 * the setting name and associated value(s)
 * 
 * @param filepath to boards.txt
 * @returns hashmap of options and values
 */
function parseBoards(filepath: string, boardName: string): Promise<Map<string, string>>{
    return new Promise((resolve, reject) => {
        const map = new Map();
        const fileStream = fs.createReadStream(filepath);

        const rl = readline.createInterface({
            input: fileStream,
            crlfDelay: Infinity,
        });

        const regex = /[^#]*=/
       
        rl.on('line', (line) => {
        
            const matches = line.match(regex);

            if(matches) {
                var str = line;
                var mapValues = str.split('=',2);
                
                if(mapValues[0].includes(boardName)) {
                    map.set(mapValues[0],mapValues[1]);
                }
                
            }
            
        });

        rl.on('close', () => {
            resolve(map);
          });

    });
}

async function hashing(version: string) {
    try {
        //calling boards.txt and platform.txt parser functions
        const localAppData = process.env.LOCALAPPDATA;
        const libraryFilePath = path.join(localAppData, "Arduino15", "packages", "DxCore","hardware","megaavr",version,"boards.txt");
        const map = await parseBoards(libraryFilePath, "avrdd");

        let platform_folder = path.join(localAppData, "Arduino15", "packages", "DxCore","hardware","megaavr",version);
        let array = await parsePlatform(platform_folder);

        let cppPatternIndex = 0;
        let recipe = "recipe.cpp.o.pattern";
        

        //finding cpp recipe line
        for(let i =0; i < array.length; i++) {
            if(array[i].includes(recipe)) {
                cppPatternIndex = i;
                // console.log(array[i]);
                break;
            }
        } 
        
        //getting all flags and variables from line
        let optionString = array[cppPatternIndex].substring(recipe.length+1,array[cppPatternIndex].length);
        let optionArray = optionString.split(" ");

        let variables: string[] = [];   //{variable}, without {}
        let standAloneFlags = [];       //-flag
        let flagAndVariables = [];      //mmcu={variable}, with {}

        //iterating through paltform.txt for variables
        for(let i = 0; i < optionArray.length; i++) {
            let str = optionArray[i];
            //checking for complex variables
            if(str.includes("=") && str.includes("{") {
                flagAndVariables.push(optionArray[i]);
            }
            //filtering for relevant simple variables
            if(str.includes("{") && !str.includes("source_file") && !str.includes("includes") && 
                !str.includes("source_files") && !str.includes("object_file") && !str.includes("core.path")) {
                variables.push(optionArray[i].substring(1,optionArray[i].length-1))
            }
        }

        //DEBUG
        console.log(variables);
        console.log(flagAndVariables);
        // console.log(options);

        //reiterating through platform.txt for variables contained both in recipe and platform.txt
        for(let i = 0; i < array.length; i++) {
            let equalIndex = array[i].indexOf("=");

            let value = array[i].substring(0,equalIndex);
            let options = array[i].substring(equalIndex+1,array[i].length);

            let index = variables.indexOf(value);
            if(index != -1) {
                
                let parsedOptions = options.split(" ");
                
                for(let i = 0; i < parsedOptions.length; i++) {
                    let opt = parsedOptions[i];
                    //flags
                    if(!opt.includes("{") && opt.includes("-")) {
                        standAloneFlags.push(opt);
                    } else if(opt.indexOf("{") != 0 && opt != "") {
                        //copmlex variables
                        const match = opt.match(/{(.*?)}/);
                        flagAndVariables.push(opt);
                        variables.push(match[1]);
                    } else if(opt != "") {
                        //simple variables
                        variables.push(opt.substring(1,opt.length-1));
                    }
                }
            }
        }

        //DEBUG
        console.log("\n\n");
        console.log(variables);
        console.log(standAloneFlags);
        console.log(flagAndVariables)
    
        //iterating through boards.txt for variable values and new variables within platform.txt variables
        map.forEach((value, key) => {
            let splitIndex = -1;
            for(let i = 0; i < variables.length; i++) {
                if(key.includes("build.flmapopts")) {

                } else if(key.includes("build.attachmode")) {

                } else if(key.includes("wiremode")) {

                } else if(key.includes("millistimer")) {

                } else if(key.includes("clocksource")) {

                } else if(key.includes(variables[i]) && !key.includes("oldversion")) {
                    console.log(key + ":   " + value);
                }
                
            }

            //TODO: add variable values to flags[] and remove simple variables from array
            //TODO: replace variables names in complex variables with their values and add to flag array
        });

        //TODO: reiterate through map for newly found variable values
    } catch (error) {
        console.error("An error occurred:", error);
    }
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
    vscode.commands.registerCommand('arduinoImportTree.selectBoardOpt', () => {
        ui.selectBoardOpt();
    });

    
    
    let flags = vscode.commands.registerCommand('arduino-mod.compilerFlags', () => {
        // getCompileFlags();
        try {
            console.log("Starting parsing")
            hashing("1.5.11");
            
        } catch(error) {
            console.log(error);
        }
    });
    context.subscriptions.push(flags);
}

export function startImport(sketchPath: string, destDir: string, board: string, boardOption: string) {
    vscode.window.showInformationMessage("Starting import.");
    //rename .ino as .cpp and copy it to the destination directory
    const file = path.basename(sketchPath);
    const cFile = file.replace(/\.ino$/, '.cpp');
    console.log("Starting to copy sketch file....");
    copyFile(sketchPath, destDir, cFile);

    //create lib folder in destination directory and copy all librarires included in sketch file
    const libPath = path.join(destDir, 'lib');
    if (!fs.existsSync(libPath)) {
        fs.mkdirSync(libPath);
    }
    console.log("Starting to copy libraries...");
    copyLibraries(libPath, sketchPath);
    vscode.window.showInformationMessage("Import complete!");
}

// This method is called when your extension is deactivated
export function deactivate() {}
