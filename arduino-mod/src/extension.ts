// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';
import * as readline from 'readline';
import * as fs from 'fs';
import * as parser from './parser'
import { MainPanel } from "./panels/MainPanel";
import { Board } from './boardsInfo';
import * as importproj from './importproj';
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
        // eslint-disable-next-line @typescript-eslint/naming-convention
        let file_type = directories[directories.length - 1].split('.');
        if(file_type.length >= 1 && libraries.includes(directories[7])) {
            if(file_type[1] === 'cpp' || (file_type[1] === 'c' || (file_type[1] === 'h' || (file_type[1] === 'hpp')))) {
                // creates new folder for each library
                fs.mkdirSync(newDirectory+"\\"+file_type[0]);
                copyFile(scanned, newDirectory+"\\"+file_type[0]);
            }
        }
    }
}

async function printFlags(version: string, chipName: string, hardCodedFlags: string) {
    let str = await parser.getAllFlags(version,chipName,hardCodedFlags);

    console.log(str);
}


// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
     
     const arduinoImportCommand = vscode.commands.registerCommand("arduino-mod.arduinoImport", () => {
        MainPanel.render(context.extensionUri);
      });
    context.subscriptions.push(arduinoImportCommand);
	vscode.commands.registerCommand('arduino-mod.test', () => {
        cmaker.resetCmakeFiles("/Users/Cole/test")        
        cmaker.cmakeSkeleton("/Users/Cole/test", "testproj");
        cmaker.addSourceFile("/Users/Cole/test", "testproj", "sketch.cpp");
        cmaker.addCompilerFlags("/Users/Cole/test", "testproj", '-c -g -Os -Wall -std=gnu++17 -fpermissive -Wno-sized-deallocation -fno-exceptions -ffunction-sections -fdata-sections -fno-threadsafe-statics -Wno-error=narrowing -MMD -flto -mrelax -mmcu=avr64dd32 -DF_CPU=24000000L -DCLOCK_SOURCE=0 -DTWI_MORS_SINGLE -DMILLIS_USE_TIMERB2 -DCORE_ATTACH_ALL -DLOCK_FLMAP -DFLMAPSECTION1 -DARDUINO=10607 -DARDUINO_avrdd -DARDUINO_ARCH_MEGAAVR -DDXCORE="1.5.10" -DDXCORE_MAJOR=1UL -DDXCORE_MINOR=5UL -DDXCORE_PATCH=10UL -DDXCORE_RELEASED=1 -DMVIO_ENABLED -I/Users/Cole/Library/Arduino15/packages/DxCore/hardware/megaavr/1.5.10/cores/dxcore/api/deprecated -I/Users/Cole/Library/Arduino15/packages/DxCore/hardware/megaavr/1.5.10/cores/dxcore -I/Users/Cole/Library/Arduino15/packages/DxCore/hardware/megaavr/1.5.10/variants/32pin-ddseries');
        cmaker.addLinkerFlags("/Users/Cole/test", "testproj", '-Wall -Wextra -Os -g -flto -fuse-linker-plugin -mrelax -Wl,--gc-sections,--section-start=.text=0x0,--section-start=.FLMAP_SECTION1=0x8000,--section-start=.FLMAP_SECTION2=0x10000,--section-start=.FLMAP_SECTION3=0x18000 -mmcu=avr64dd32 -o');
    });

    
    
    let flags = vscode.commands.registerCommand('arduino-mod.compilerFlags', () => {
        printFlags();
    });
    context.subscriptions.push(flags);
}

export function startImport(sketchPath: string, destDir: string, board: Board) {
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

    //DEBUG
    // printFlags("1.5.11",board.getChipName(),board.getHardcodedFlags());
}

// This method is called when your extension is deactivated
export function deactivate() {}