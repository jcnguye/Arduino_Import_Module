import * as vscode from 'vscode';
import * as parser from './parser';
import * as path from 'path';
import * as fs from 'fs';
import * as flagParser from './flagParser';

export const UNO = "UNO"; //none 
export const NANO = "Nano"; //ATmega328P or ATmega328P (Old Bootloader) 
export const MEGA = "Mega or Mega2560"; //ATMega2560; ATMega1280 
export const PRO = "Pro or Pro Mini"; //ATmega328P (5V, 16 MHz); ATmega328P (3.3V, 8 MHz) 
export const DXCORE = "DxCore";

const unoOptions: string [] = [];
const nanoOptions: string [] = ["ATmega328P or ATmega328P (Old Bootloader)"];
const megaOptions: string [] = ["ATMega2560", "ATMega1280"];
const proOptions: string [] = ["ATmega328P (5V, 16 MHz)", "ATmega328P (3.3V, 8 MHz)"];
const dxcoreOptions: string [] = [];

export function getAllBoards(): string[] {
    const result = [UNO, NANO, MEGA, PRO, DXCORE];
    return result;
}
export function getBoard(boardName: string): Board {
    return new Board(boardName);
}
export function getBoardOptions(boardName: string): string[] {
    if (boardName === UNO ) {
        return unoOptions;
    } else if (boardName === NANO ) {
        return nanoOptions;
    } else if (boardName === MEGA ) {
        return megaOptions;
    } else if (boardName === PRO ) {
        return proOptions;
    } else {
        return dxcoreOptions;
    }
}

/**
 * Board class that stores hardcoded data for each board
 */
export class Board{
    boardName: string;
    private flags: string = "";
    private chipName: string = "";
    private corePaths: [string, string][] = []; // tuple of core lib path and ./core/ dest
    private pathToCompiler: string = "";

    //used by cmaker class
    private cFlags: string = "";
    private cxxFlags: string = "";
    private cFlagsLinker: string = "";


    constructor(boardName: string) {
        this.boardName = boardName;

        var localAppData = "???";
		if(process.platform === "win32") {
			localAppData = path.join(process.env.LOCALAPPDATA!, "Arduino15");
		} else if(process.platform === "darwin") {
			localAppData = path.join(process.env.HOME!, "Library", "Arduino15");
		} else if(process.platform === "linux") {
			localAppData = path.join(process.env.HOME!, ".arduino15");
		}


        if(boardName === NANO) {
            this.nanoBuild(localAppData);
        } else if (boardName === DXCORE) {
            this.dxcoreBuild(localAppData);
        }else if (boardName === MEGA) {
            this.megaBuild(localAppData);
        } else if (boardName === PRO) {
            this.proBuild(localAppData);
        }
    }

    getBoardName() {
        return this.boardName;
    }

    getFlags() {
        return this.flags;
    }

    getChipName() {
        return this.chipName;
    }

    getCorePaths() {
        return this.corePaths;
    }

    getPathToCompiler() {
        return this.pathToCompiler;
    }

    getCFlags(): string {
        return this.cFlags;
    }

    getCXXFlags(): string {
        return this.cxxFlags;
    }

    getCFlagsLinker(): string {
        return this.cFlagsLinker;
    }

    setBoardName(boardName:string):void{
        this.boardName = boardName;
    }
    setFlag(flag:string):void{
        this.flags = flag;
    }
    setChipName(chipName:string):void{
        this.chipName = chipName;
    }

    nanoBuild(localAppData:string): void { 
             
        if (localAppData) {
            this.pathToCompiler = path.join(localAppData,"packages","arduino","tools","avr-gcc");
            const compilerVersion = this.mostRecentDirectory(this.pathToCompiler); 
            this.pathToCompiler = path.join(this.pathToCompiler, compilerVersion); 
            
          	const basepath = path.join(localAppData, "packages", "arduino", "hardware", "avr", parser.getNanoVersion());
            	
            this.corePaths.push([path.join(basepath, "cores", "arduino"), "core"]);
            this.corePaths.push([path.join(basepath, "variants", "eightanaloginputs"), path.join("core", "eightanaloginputs")]);
            this.corePaths.push([path.join(basepath, "variants", "standard"), path.join("core", "standard")]);

            // get flags
            const platformPath = path.join(basepath, 'platform.txt');
	        const boardPath = path.join(basepath, 'boards.txt');
            const boardOptionsAndName: string[] = ['nano.menu.cpu.atmega328.', 'nano.'];
            const hardcodedFlags = new Map<string, string>();
	        hardcodedFlags.set('build.arch','AVR');
	        hardcodedFlags.set('includes','');
	        hardcodedFlags.set('runtime.ide.version','10607');

	        this.cFlags = flagParser.obtainFlags('recipe.c.o.pattern', boardOptionsAndName, platformPath, boardPath, hardcodedFlags);
            this.cxxFlags = flagParser.obtainFlags('recipe.cpp.o.pattern', boardOptionsAndName, platformPath, boardPath, hardcodedFlags);
            this.cFlagsLinker = flagParser.obtainFlags('recipe.c.combine.pattern', boardOptionsAndName, platformPath, boardPath, hardcodedFlags);

            // modify flags so they work with cmake
            this.cFlags = this.cFlags.replace('-c ', '');
            this.cFlags = this.cFlags.replace('-fno-fat-lto-objects','-fno-fat-lto-objects -ffat-lto-objects');
            this.cxxFlags = this.cxxFlags.replace('-c ', '');
            this.cxxFlags = this.cxxFlags.replace('-flto','-flto -fno-fat-lto-objects -ffat-lto-objects');
        }

    }
   

    dxcoreBuild(localAppData:string): void{
        this.setFlag("-DARDUINO_ARCH_MEGAAVR -DARDUINO=10607 -Wall -Wextra -DF_CPU=24000000L") ;
        this.chipName = "avrdd";

        const version = parser.getDXCoreVersion();
        
        if (localAppData) {
            this.pathToCompiler = path.join(localAppData,"packages","DxCore","tools","avr-gcc");
            const compilerVersion = this.mostRecentDirectory(this.pathToCompiler);
            this.pathToCompiler = path.join(this.pathToCompiler, compilerVersion);
            
            this.corePaths.push([path.join(localAppData, "packages", "DxCore","hardware","megaavr",version,"cores","dxcore"), "core"]);
            //TODO - determine which variants are needed & correct path
            //this.corePaths.push(path.join(localAppData, "packages", "DxCore","hardware","megaavr",version,"variants","32pin-ddseries"));
            //this.corePaths.push(path.join(localAppData, "packages", "DxCore","tools","avr-gcc",compilerVersion,"avr","include"));
        }
    }

    /**
     * Replaces a default CXX flag with a customized flag. If the flag to be replaced
     * is not found, the replacement string is appended to the end of the cxx
     * flag string (as long as it's not an empty string).
     * 
     * Replacement function can be used to remove a flag, as long as its
     * replacement flag is set as an empty string ('').
     * 
     * @param original : flag to be replaced
     * @param replacement : replacement flag
     */
    replaceCXXFlag(original: string, replacement: string) {
        let tempChange =  this.cxxFlags.replace(original, replacement);

        if(tempChange !== this.cxxFlags) {
            this.cxxFlags = tempChange;
        } else if(replacement !== '') {
            this.cxxFlags += ' ' + replacement;
        }
    }

    /**
     * Replaces a default c flag with a customized flag. If the flag to be replaced
     * is not found, the replacement string is appended to the end of the cxx
     * flag string (as long as it's not an empty string).
     * 
     * Replacement function can be used to remove a flag, as long as its
     * replacement flag is set as an empty string ('').
     * 
     * @param original : flag to be replaced
     * @param replacement : replacement flag
     */
    replaceCFlag(original: string, replacement: string) {
        let tempChange =  this.cFlags.replace(original, replacement);

        if(tempChange !== this.cFlags) {
            this.cFlags = tempChange;
        } else if(replacement !== '') {
            this.cFlags += ' ' + replacement;
        }
    }

    /**
     * Replaces a default linker flag with a customized flag. If the flag to be replaced
     * is not found, the replacement string is appended to the end of the cxx
     * flag string (as long as it's not an empty string).
     * 
     * Replacement function can be used to remove a flag, as long as its
     * replacement flag is set as an empty string ('').
     * 
     * @param original : flag to be replaced
     * @param replacement : replacement flag
     */
    replaceLinkerFlag(original: string, replacement: string) {
        let tempChange =  this.cFlagsLinker.replace(original, replacement);

        if(tempChange !== this.cFlagsLinker) {
            this.cFlagsLinker = tempChange;
        } else if(replacement !== '') {
            this.cFlagsLinker += ' ' + replacement;
        }
    }

    /**
     * Appends inputted flags to cxx flags
     * @param flags flags to append
     */
    addCXXFlag(flags: string) {
        this.cxxFlags += flags;
    }

    /**
     * Appends inputted flags to c flags
     * @param flags flags to append
     */
    addCFlags(flags: string) {
        this.cFlags += flags;
    }

    /**
     * Appends inputted flags to linker flags
     * @param flags flags to append
     */
    addLinkerFlags(flags: string) {
        this.cFlagsLinker += flags;
    }

    megaBuild(localAppData:string): void{

    }

    proBuild(localAppData:string): void{

    }

    /**
 * Helper function to determine which directory inside a given directory is the most recent
 * based on the modified stamp
 * @param dirPath Path to the directory that should be investigated
 * @returns The name of the directory inside dirPath that was most recently updated
 */
    mostRecentDirectory(dirPath: string): string {
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

}
