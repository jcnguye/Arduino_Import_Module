import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import {FlagParser} from './flagParser';
import { getLocalArduinoPath } from './extension';

export const UNO = "UNO"; //none 
export const NANO = "Nano"; //ATmega328P or ATmega328P (Old Bootloader) 
export const MEGA = "Mega or Mega2560"; //ATMega2560; ATMega1280 
export const PRO = "Pro or Pro Mini"; //ATmega328P (5V, 16 MHz); ATmega328P (3.3V, 8 MHz) 
export const DXCORE = "DxCore";

const dxCoreVariants = ["DA","DB","DD","EA"];


export function getAllBoards(): string[] {
    const result = [NANO, DXCORE];
    return result;
}

export function getBoard(boardName: string): Board {
    return new Board(boardName);
}

/**
 * Board class that stores hardcoded data for each board
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

    

    //used by cmaker class
    private cFlags: string = "";
    private cxxFlags: string = "";
    private cFlagsLinker: string = "";
 
    constructor(boardName: string, dxChip?: string, dxPrintOption?: string, dxMvio?: string) {
        this.boardName = boardName;
        
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
            const hardcodedFlags = new Map<string, string>();
	        hardcodedFlags.set('build.arch','AVR');
	        hardcodedFlags.set('includes','');
	        hardcodedFlags.set('runtime.ide.version','10607');

            this.flagParser = new FlagParser('recipe.c.combine.pattern', boardOptionsAndName, platformPath, boardPath, hardcodedFlags);
            this.cFlagsLinker = this.flagParser.obtainFlags();
            this.flagParser = new FlagParser('recipe.cpp.o.pattern', boardOptionsAndName, platformPath, boardPath, hardcodedFlags);
            this.cxxFlags = this.flagParser.obtainFlags();
            this.flagParser = new FlagParser('recipe.c.o.pattern', boardOptionsAndName, platformPath, boardPath, hardcodedFlags);
            this.cFlags = this.flagParser.obtainFlags();

            // modify flags so they work with cmake
            this.cFlags = this.cFlags.replace('-c ', '');
            this.cFlags = this.cFlags.replace('-fno-fat-lto-objects','-fno-fat-lto-objects -ffat-lto-objects');
            this.cxxFlags = this.cxxFlags.replace('-c ', '');
            this.cxxFlags = this.cxxFlags.replace('-flto','-flto -fno-fat-lto-objects -ffat-lto-objects');       
        }

    }

    dxcoreBuild(localArduinoPath:string): void{
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


            const hardcodedFlags = new Map<string, string>();
	        hardcodedFlags.set('build.arch','MEGAAVR');
	        hardcodedFlags.set('includes','');
	        hardcodedFlags.set('runtime.ide.version','10607');
            //hardcode flags for c flags
            hardcodedFlags.set('build.f_cpu','24000000L');
            //these flags below seems to be user defined from the menu option hard coded for now 
            hardcodedFlags.set('build.clocksource','0');
            hardcodedFlags.set('build.wiremode','MORS_SINGLE');
            hardcodedFlags.set('build.millistimer','B2');
            hardcodedFlags.set('build.attachmode','-DCORE_ATTACH_ALL');
            hardcodedFlags.set('build.flmapopts','-DLOCK_FLMAP -DFLMAPSECTION1');
            hardcodedFlags.set('bootloader.appspm','');
            hardcodedFlags.set('DOWNLOADED_FILE#"v"',dxCoreVersion);
            hardcodedFlags.set('version',dxCoreVersion);

            this.flagParser = new FlagParser('recipe.c.combine.pattern', boardOptionsAndName, platformPath, boardPath, hardcodedFlags);
            let Cflag = new FlagParser('recipe.c.o.pattern', boardOptionsAndName, platformPath, boardPath, hardcodedFlags);
            let CXXflag = new FlagParser('recipe.cpp.o.pattern', boardOptionsAndName, platformPath, boardPath, hardcodedFlags);
          
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

    /**
     * Replaces a default CXX flag with a customized flag. If the flag to be replaced
     * is not found, the replacement string is appended to the end of the cxx
     * flag string (as long as it's not an empty string).
     * 
     * @param original : flag to be replaced
     * @param replacement : replacement flag
     */
    replaceCXXFlag(original: string, replacement: string) {
        replacement = replacement.trim();
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
     * @param original : flag to be replaced
     * @param replacement : replacement flag
     */
    replaceCFlag(original: string, replacement: string) {
        replacement = replacement.trim();
        
        let tempChange =  this.cFlags.replace(original, replacement);

        if(tempChange !== this.cFlags) {
            this.cFlags = tempChange;
        } else if(replacement !== '') {
            this.cFlags += " " + replacement;
        }
    }

    /**
     * Replaces a default linker flag with a customized flag. If the flag to be replaced
     * is not found, the replacement string is appended to the end of the cxx
     * flag string (as long as it's not an empty string).
     * 
     * @param original : flag to be replaced
     * @param replacement : replacement flag
     */
    replaceLinkerFlag(original: string, replacement: string) {
        replacement = replacement.trim();

        let tempChange = this.cFlagsLinker.replace(original, replacement);

        if(tempChange !== this.cFlagsLinker) {
            this.cFlagsLinker = tempChange;
        } else if(replacement !== '') {
            this.cFlagsLinker += " " + replacement;
        }
    }

    /**
     * Appends inputted flags to cxx flags
     * @param flags flags to append
     */
    addCXXFlag(flags: string) {
        flags = flags.trim();
        this.cxxFlags += " " + flags;
    }

    /**
     * Appends inputted flags to c flags
     * @param flags flags to append
     */
    addCFlags(flags: string) {
        flags = flags.trim();
        this.cFlags += flags;
    }

    /**
     * Appends inputted flags to linker flags
     * @param flags flags to append
     */
    addLinkerFlags(flags: string) {
        flags = flags.trim();
        this.cFlagsLinker += flags;
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
