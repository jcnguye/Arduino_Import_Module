// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';
import * as readline from 'readline';
import * as fs from 'fs';
import * as parser from './parser';
import { MainPanel } from "./panels/MainPanel";
import { Board } from './board';
import Cmaker from './cmaker';
import * as importproj from './importproj';
import { Console } from 'console';

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
        for (var i = 0; i < flagArr.length; i++) {flagStr += flagArr[i] + ',\n';}
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
            if (line.includes("compiler.") && line.includes(".flags")) {
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
    var localAppData = "???";
	if(process.platform === "win32") {
		localAppData = path.join(process.env.LOCALAPPDATA!, "Arduino15")
	} else if(process.platform === "darwin") {
		localAppData = path.join(process.env.HOME!, "Library", "Arduino15")
	} else if(process.platform === "linux") {
		localAppData = path.join(process.env.HOME!, ".arduino15")
	}
    const libraryFilePath = path.join(localAppData, "libraries");
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
        // eslint-disable-next-line @typescript-eslint/naming-convention
        let file_type = directories[directories.length - 1].split('.');
        if(file_type.length >= 1 && libraries.includes(directories[7])) {
            if(file_type[1] === 'cpp' || (file_type[1] === 'c' || (file_type[1] === 'h' || (file_type[1] === 'hpp')))) {
                // creates new folder for each library
                //fs.mkdirSync(newDirectory+"\\"+file_type[0]);
                //copyFile(scanned, newDirectory+"\\"+file_type[0]);
                copyFile(scanned, newDirectory);
            }
        }
    }
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	
    const arduinoImportCommand = vscode.commands.registerCommand("arduino-mod.arduinoImport", () => {
      MainPanel.render(context.extensionUri);
    });
    context.subscriptions.push(arduinoImportCommand);
}


export async function startImport(sketchPath: string, destDir: string, board: Board) {
    vscode.window.showInformationMessage("Starting import.");
    //rename .ino as .cpp and copy it to the destination directory
    const file = path.basename(sketchPath);
    const cFile = file.replace(/\.ino$/, '.cpp');
    console.log("Starting to copy sketch file....");
    const srcPath = path.join(destDir, 'src');
    if (!fs.existsSync(srcPath)) {
        fs.mkdirSync(srcPath);
    }
    copyFile(sketchPath, srcPath, cFile, '#include <Arduino.h>\n');

    //create lib folder in destination directory and copy all librarires included in sketch file
    const libPath = path.join(destDir, 'lib');
    if (!fs.existsSync(libPath)) {
        fs.mkdirSync(libPath);
    }
    console.log("Starting to copy libraries...");
    copyLibraries(libPath, sketchPath);
    console.log("Library import complete");

    //create core folder in destination directory & copy appropriate code device library source files
    const corePath = path.join(destDir, 'core');
    if (!fs.existsSync(corePath)) {
        fs.mkdirSync(corePath);
    }
    console.log("Starting to copy code device library files...");
    importproj.copyDirectoriesPaired(board.getCorePaths(), destDir);
    console.log("Core import complete");

    //copy avr-gcc compiler 
    const compilerPath = path.join(destDir, 'compiler');
    if (!fs.existsSync(compilerPath)) {
        fs.mkdirSync(compilerPath);
    }
    importproj.copyDirectory(board.getPathToCompiler(), compilerPath);
    console.log("Compiler copy complete");

    // create makefile
    console.log("Creating makefile...");
    const makefileContent = `
# Makefile
# Compiler
CC = core/compiler/bin/avr-gcc.exe

# Compiler flags
CFLAGS = -Wall -g -Icore/ -c -g -Os -std=gnu++17 -fpermissive -Wno-sized-deallocation -fno-exceptions -ffunction-sections -fdata-sections -fno-threadsafe-statics -Wno-error=narrowing -MMD -flto -mrelax -DARDUINO_avrdd -mmcu=avr64dd32 -DCLOCK_SOURCE=0 -DMILLIS_USE_TIMERB2 -DCORE_ATTACH_ALL -DTWI_MORS_SINGLE -DLOCK_FLMAP -DFLMAPSECTION1 -DARDUINO_ARCH_MEGAAVR -DARDUINO=10607 -Wall -Wextra -DF_CPU=24000000L -DDXCORE_MAJOR=1UL -DDXCORE_MINOR=5UL -DDXCORE_PATCH=11UL -DDXCORE_RELEASED=1 -DMVIO_ENABLED 

# Source files
SOURCES = src/${cFile}

# Output executable
EXECUTABLE = arduino-import

# Library path
LIB_PATH = -L./lib

# Wildcard to find all shared libraries
LIBS = $(wildcard ./lib/*.h)

# Build rule
$(EXECUTABLE): $(SOURCES)
\t$(CC) $(CFLAGS) $^ -o $@ $(LIB_PATH) $(LIBS)

# Clean rule
clean:
\trm -f $(EXECUTABLE)
`;

    const makefilePath = path.join(__dirname, 'Makefile');
    console.log("Make file is here temporarily: " + makefilePath);
    fs.writeFileSync(makefilePath, makefileContent.trim());
    console.log("Makefile created");

    const cmake= new Cmaker();
    cmake.setProjectDirectory(destDir);
    cmake.setProjectName(cFile.replace(".cpp", ""));
    cmake.setSourceName('src/' + cFile);
    cmake.setCompilerFlags(await parser.getAllFlags(board));

    //testing Nano Parser Flag
    board.getCflagsNano("C:\Users\triplit\AppData\Local\Arduino15\packages\arduino\hardware\avr\1.8.6\boards.txt");



    //TODO - this needs to be fixed to link correct files
    cmake.setLinkerFlags('-Wall -Wextra -Os -g -flto -fuse-linker-plugin -mrelax -Wl,--gc-sections,--section-start=.text=0x0,--section-start=.FLMAP_SECTION1=0x8000,--section-start=.FLMAP_SECTION2=0x10000,--section-start=.FLMAP_SECTION3=0x18000 -mmcu=avr64dd32');
    cmake.build();



    vscode.window.showInformationMessage("Import complete!");
}



// This method is called when your extension is deactivated
export function deactivate() {}
