import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import {FlagParser} from './flagParser';
import { getLocalArduinoPath } from './extension';
import {RECIPE} from './constants';

export const UNO = "UNO"; //none 
export const NANO = "Nano"; //ATmega328P or ATmega328P (Old Bootloader) 
export const MEGA = "Mega or Mega2560"; //ATMega2560; ATMega1280 
export const PRO = "Pro or Pro Mini"; //ATmega328P (5V, 16 MHz); ATmega328P (3.3V, 8 MHz) 
export const DXCORE = "DxCore";

const dxCoreVariants = ["DA","DB","DD","EA"];


/**
 * Returns an array of board name strings
 *
 * @return String array containing all supported board names
 */
export function getAllBoards(): string[] {
    const result = [NANO, DXCORE];
    return result;
}


/**
 * Returns a Board object.
 *
 * @param boardName The name of the board (DxCore, Nano) to create
 * @returns A new Board object.
 */
export function getBoard(boardName: string): Board {
    return new Board(boardName, "");
}

/**
 * Class that holds information about the specified board and generates
 * the core, library, and compiler paths for the board.
 */
export class Board {
    boardName: string;
    private flags: string = "";
    private chipName: string = "";
    private corePaths: [string, string][] = []; // tuple of core lib path and ./core/ dest
    private pathToCompiler: string = "";
    private pathToCoreLibs: string = "";
    private pathToHardware: string = "";
    private pathToPlatformFile: string = "";
    private pathToBoardFile: string = "";

    private dxCoreSeries: string = "";
    private dxCoreVariant: string = "";
    private dxCorePrint: string = "";
    private dxCoreEnableMvio: string = "";

    private flagParser: FlagParser | undefined;
    private pathToOverrideFlags: string = "";

    

    //used by cmaker class
    private cFlags: string = "";
    private cxxFlags: string = "";
    private cFlagsLinker: string = "";
    
    
	/**
	 * @param boardName The name of the board
	 * @param pathToOverrideFlags The file containing flag overrides.
	 * @param dxChip Optional string containing the DxCore chip variant (ex: "AVR64DD32")
	 * @param dxPrintOption Optional string to enable other print options on DxCore boards. Possible values are "default", "full", "minimal", and ""
	 * @param dxMvio Possible values are "Enabled", "Disabled", and ""
	 *
	 */
    constructor(boardName: string, pathToOverrideFlags: string, dxChip?: string, dxPrintOption?: string, dxMvio?: string) {
        this.boardName = boardName;
        this.pathToOverrideFlags = pathToOverrideFlags;
        
        const localArduinoPath= getLocalArduinoPath();

        if(boardName === NANO) {
            this.nanoBuild(localArduinoPath);
        } else if (boardName === DXCORE) {
            if (dxChip && dxPrintOption) {
                this.setDxCoreOptions(dxChip, dxPrintOption, dxMvio);
                this.dxcoreBuild(localArduinoPath);
            } else {
                console.error("The DxCore requires the chip and print options to be specified");
            }
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

    getPathToCoreLibs() {
        return this.pathToCoreLibs;
    }

    getPathToHardware() {
        return this.pathToHardware;
    }
    getPathToPlatformFile() {
        return this.pathToPlatformFile;
    }
    getPathToBoardFile() {
        return this.pathToBoardFile;
    }
    setPathToHardware(hardwarePath: string) {
        this.pathToHardware = hardwarePath;
    }
    
    setDxCoreOptions(dxChip: string, dxPrintOption: string, dxMvio?: string) {
        this.dxCoreVariant = dxChip;
        this.dxCorePrint = dxPrintOption;
        
        for(let i = 0; i < dxCoreVariants.length; i++) {
            if(dxChip.includes(dxCoreVariants[i])) {
                this.dxCoreSeries = "avr" + dxCoreVariants[i].toLowerCase();
            }
        }
        
        if(dxMvio) {
            this.dxCoreEnableMvio = dxMvio;
        }
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
    setFlag(flag: string): void {
        this.flags = flag;
    }
    setChipName(chipName: string): void {
        this.chipName = chipName;
    }

    setCFlags(cFlags: string): void{
        this.cFlags = cFlags;
    }
    setCXXFlags(cxxFlags: string): void{
        this.cxxFlags = cxxFlags;
    }
	
	
	/**
	 * Configures this board object with the correct paths based off the provided argument.
	 * 
	 * @param localArduinoPath The string location of the Arduino15 in the user's home directory.
	 */
    nanoBuild(localArduinoPath:string): void { 
             
        if (localArduinoPath) {
            this.pathToCompiler = path.join(localArduinoPath,"packages","arduino","tools","avr-gcc");
            const compilerVersion = this.mostRecentDirectory(this.pathToCompiler); 
            this.pathToCompiler = path.join(this.pathToCompiler, compilerVersion); 
            
          	let basepath = path.join(localArduinoPath, "packages", "arduino", "hardware", "avr");
            const nanoVersion = this.mostRecentDirectory(basepath);
            basepath = path.join(basepath, nanoVersion);

            this.pathToCoreLibs = path.join(basepath, "libraries");
            	
            this.corePaths.push([path.join(basepath, "cores", "arduino"), "core"]);
            this.corePaths.push([path.join(basepath, "variants", "eightanaloginputs"), path.join("core", "eightanaloginputs")]);
            this.corePaths.push([path.join(basepath, "variants", "standard"), path.join("core", "standard")]);

            // get flags
            const platformPath = path.join(basepath, 'platform.txt');
	        const boardPath = path.join(basepath, 'boards.txt');
            const boardOptionsAndName: string[] = ['nano.menu.cpu.atmega328.', 'nano.'];
            const hardcodedFlags = this.getOverrideFlags();
	        hardcodedFlags.set('build.arch','AVR');
	        hardcodedFlags.set('includes','');
	        hardcodedFlags.set('runtime.ide.version','10607');

            this.flagParser = new FlagParser(RECIPE.C_COMBINE, boardOptionsAndName, platformPath, boardPath, hardcodedFlags);
            this.cFlagsLinker = this.flagParser.obtainFlags();
            this.flagParser = new FlagParser(RECIPE.CPP_PATTERN, boardOptionsAndName, platformPath, boardPath, hardcodedFlags);
            this.cxxFlags = this.flagParser.obtainFlags();
            this.flagParser = new FlagParser(RECIPE.C_PATTERN, boardOptionsAndName, platformPath, boardPath, hardcodedFlags);
            this.cFlags = this.flagParser.obtainFlags();

            // modify flags so they work with cmake
            this.cFlags = this.cFlags.replace('-c ', '');
            this.cFlags = this.cFlags.replace(RECIPE.FNO_ORIG_C,RECIPE.FNO_REPLACE_C);
            this.cxxFlags = this.cxxFlags.replace('-c ', '');
            this.cxxFlags = this.cxxFlags.replace(RECIPE.FNO_ORIG_CPP,RECIPE.FNO_REPLACE_CPP);       
        }

    }
	
	/**
	 * Configures this board object with the correct paths based off the provided argument.
	 * 
	 * @param localArduinoPath The string location of the Arduino15 in the user's home directory.
	 */
    dxcoreBuild(localArduinoPath:string): void {
        // this.setFlag("-DARDUINO_ARCH_MEGAAVR -DARDUINO=10607 -Wall -Wextra -DF_CPU=24000000L") ;
        this.chipName = "avrdd";
        
        if (localArduinoPath) {
            this.pathToCompiler = path.join(localArduinoPath,"packages","DxCore","tools","avr-gcc");
            const compilerVersion = this.mostRecentDirectory(this.pathToCompiler);
            this.pathToCompiler = path.join(this.pathToCompiler, compilerVersion);
            
            let basepath = path.join(localArduinoPath, "packages", "DxCore","hardware","megaavr");
            const dxCoreVersion = this.mostRecentDirectory(basepath);
            basepath = path.join(basepath, dxCoreVersion);
            
            this.pathToCoreLibs = path.join(basepath, "libraries");

            const platformPath = path.join(basepath,'platform.txt');
            const boardPath = path.join(basepath,'boards.txt');
           
            
            this.pathToBoardFile = boardPath;
            this.pathToPlatformFile = platformPath;
            
            // Add chip & board 
            const boardOptionsAndName: string[] = [this.dxCoreSeries + '.menu.chip.' + this.dxCoreVariant.toLowerCase() + '.', this.dxCoreSeries + '.'];
            // Add printf options
            boardOptionsAndName.push(this.dxCoreSeries + '.menu.printf.' + this.dxCorePrint + '.');   
            //if mvio options exist, add them
            if (this.dxCoreEnableMvio) {
                boardOptionsAndName.push(this.dxCoreSeries + '.menu.mvio.' + this.dxCoreEnableMvio.toLowerCase() + '.');
            }


            
            const hardcodedFlags = this.getOverrideFlags();

	        hardcodedFlags.set('build.arch','MEGAAVR');
	        hardcodedFlags.set('includes','');
	        hardcodedFlags.set('runtime.ide.version','10607');
            hardcodedFlags.set('DOWNLOADED_FILE#"v"',dxCoreVersion);
            hardcodedFlags.set('version',dxCoreVersion);
            

            this.flagParser = new FlagParser(RECIPE.C_COMBINE, boardOptionsAndName, platformPath, boardPath, hardcodedFlags);
            let Cflag = new FlagParser(RECIPE.C_PATTERN, boardOptionsAndName, platformPath, boardPath, hardcodedFlags);
            let CXXflag = new FlagParser(RECIPE.CPP_PATTERN, boardOptionsAndName, platformPath, boardPath, hardcodedFlags);
          
            this.cFlagsLinker = this.flagParser.obtainFlags();

            this.cxxFlags = CXXflag.obtainFlags();  //part of the MVIO menu added not containing in platform 
            this.cFlags = Cflag.obtainFlags();

            // modify flags so they work with cmake
            this.cFlags = this.cFlags.replace(/"/g, '');
            this.cFlags = this.cFlags.replace('-c ', '');
            this.cxxFlags = this.cxxFlags.replace(/"/g, '');
            this.cxxFlags = this.cxxFlags.replace('-c ', '');

            //Populate corePaths
            this.corePaths.push([path.join(basepath,"cores","dxcore"), "core"]);
            //Add the correct arduino_pins.h file based on the variant for the board options selected
            this.corePaths.push([path.join(basepath,"variants",this.flagParser.obtainVariant()),"core"]);
        }
    }

    getOverrideFlags(): Map<string, string>{
        const overrideFlags = new Map<string, string>();
        const filepath = path.join(this.pathToOverrideFlags, "flag_override.txt");
        let overrideData = '';
        try {
            overrideData = fs.readFileSync(filepath, 'utf8');
        } catch (err) {
            if (err && typeof err === 'object' && 'code' in err) {
                const error = err as NodeJS.ErrnoException;
                // If the file is not found, only log an error for the DxCore. flag_override.txt is not 
                // required for the Nano
                if (error.code === 'ENOENT') {
                    if (this.boardName === DXCORE) {
                        console.error("The file 'flag_override.txt' must exist in the destination directory. Error: ", err);
                    } 
                } else {
                    console.error('File system error:', error.code);
                }
            } else {
                console.error('An unknown error occurred:', err);
            }           
        }

        if (overrideData) {
            const lines = overrideData.split('\n');
            lines.forEach(line => {
                if(line.includes('\r')) {
                    line = line.replace('\r',''); //remove carriage returns if they exist
                }
                const index = line.indexOf('=');
                if (index !== -1) {
                    const key = line.substring(0, index);
                    const value = line.substring(index + 1);
                    overrideFlags.set(key, value);
                }
            });
        }

        return overrideFlags;
    }
	
    /**
	 * Helper function to determine which directory inside a given directory is the most recent
	 * based on the modified stamp
	 * @param dirPath Path to the directory that should be investigated
	 * @returns The name of the directory inside dirPath that was most recently updated
	 */
    mostRecentDirectory(dirPath: string) {
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
