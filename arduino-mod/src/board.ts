import * as vscode from 'vscode';
import * as parser from './parser';
import * as path from 'path';
import * as fs from 'fs';
import {FlagParser} from './flagParser';

export const UNO = "UNO"; //none 
export const NANO = "Nano"; //ATmega328P or ATmega328P (Old Bootloader) 
export const MEGA = "Mega or Mega2560"; //ATMega2560; ATMega1280 
export const PRO = "Pro or Pro Mini"; //ATmega328P (5V, 16 MHz); ATmega328P (3.3V, 8 MHz) 
export const DXCORE = "DxCore";

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
    private flagParser: FlagParser | undefined;
    

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

    nanoBuild(localAppData:string): void { 
             
        if (localAppData) {
            this.pathToCompiler = path.join(localAppData,"packages","arduino","tools","avr-gcc");
            const compilerVersion = this.mostRecentDirectory(this.pathToCompiler); 
            this.pathToCompiler = path.join(this.pathToCompiler, compilerVersion); 
            
          	const basepath = path.join(localAppData, "packages", "arduino", "hardware", "avr", parser.getNanoVersion());

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

            this.pathToHardware = basepath;
            var arduinoPackagePathBoard = path.join(basepath, 'boards.txt');
            var arduinoPackagePathPlatform = path.join(basepath, 'platform.txt');
            this.pathToBoardFile = arduinoPackagePathBoard;
            this.pathToPlatformFile = arduinoPackagePathPlatform;
       
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
            // this.corePaths.push(path.join(localAppData, "packages", "DxCore","hardware","megaavr",version,"variants","32pin-ddseries"));
            // this.corePaths.push(path.join(localAppData, "packages", "DxCore","tools","avr-gcc",compilerVersion,"avr","include"));
            
            const basepath = path.join(localAppData, "packages", "DxCore","hardware","megaavr",version);
            const platformPath = path.join(basepath,'platform.txt');
            const boardPath = path.join(basepath,'boards.txt');
           
            
            this.pathToBoardFile = boardPath;
            this.pathToPlatformFile = platformPath;
            //avrdd.menu.chip.avr64dd32.build.mcu
            const boardOptionsAndName: string[] = ['avrdd.menu.chip.avr64dd32.', 'avrdd.'];
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


            this.flagParser = new FlagParser('recipe.c.combine.pattern', boardOptionsAndName, platformPath, boardPath, hardcodedFlags);
            //Need to be fixed reading the c and c++ flags in progress
            let Cflag = new FlagParser('recipe.c.o.pattern', boardOptionsAndName, platformPath, boardPath, hardcodedFlags);
            let CXXflag = new FlagParser('recipe.cpp.o.pattern', boardOptionsAndName, platformPath, boardPath, hardcodedFlags);
          
            console.log('dxcore Link flag parser test\n '+this.flagParser.obtainFlags());
            this.cFlagsLinker = this.flagParser.obtainFlags();
            
            console.log('CXXflag test\n '+ CXXflag.obtainFlags);
            console.log('Cflag test\n '+ Cflag.obtainFlags);

            this.cxxFlags = CXXflag.obtainFlags() + ' -DMVIO_ENABLED';  //part of the MVIO menu added not containing in platform
            this.cFlags = Cflag.obtainFlags() + ' -DMVIO_ENABLED';

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

    /**
* Function that retrieves information of nano boards flags within board.txt 
* @param filePath Path to arduino hardware file
* @returns a string compriseing of information on the nano board flags
*/
    getBoardflagsNano(filePath: string) {
        let insideSection = false;
        // Split the content by lines
        let cFlag = "";
        let cFlagArr = [];
        try {
            const data = fs.readFileSync(filePath, 'utf-8');
            const dataArr = data.split('\n');
            for (const line of dataArr) {
                if (line === 'nano.name=Arduino Nano') {
                    insideSection = true;
                }
                if (line === '## Arduino Nano w/ ATmega328P') {
                    insideSection = false;

                }
                if (insideSection === true && !(line === '') && !line.includes('#')) {
                    cFlagArr.push(line);
                }
            }
            cFlag = cFlagArr.join(" ");
        } catch (error) {
            cFlag = "Error occurred while reading the file.";
        }

        return cFlag;
    }

    //Get all flags associated to Arduino Nano w/ ATmega328P
    getBoardMegaNanoFlag() {
        let insideSection = false;
        // Split the content by lines
        let cFlag = "";
        let cFlagArr = [];
        try {
            const data = fs.readFileSync(this.getPathToBoardFile(), 'utf-8');
            const dataArr = data.split('\n');
            for (const line of dataArr) {
                if (line === 'nano.menu.cpu.atmega328=ATmega328P') {
                    insideSection = true;

                }
                if (line === '## Arduino Nano w/ ATmega328P (old bootloader)') {
                    insideSection = false;

                }
                if (insideSection === true && !(line === '') && !line.includes('#')) {
                    cFlagArr.push(line);
                }

            }
            cFlag = cFlagArr.join(" ");
        } catch (error) {
            cFlag = "Error occurred while reading the file.";
        }

        return cFlag;
    }

    // Get all flags associated to Arduino Nano w/ ATmega328P (old bootloader)
    getBoardMegaNanoBootloaderFlag(filePath: string) {
        let insideSection = false;
        // Split the content by lines
        let cFlag = "";
        let cFlagArr = [];
        try {
            const data = fs.readFileSync(filePath, 'utf-8');
            const dataArr = data.split('\n');
            for (const line of dataArr) {
                if (line === 'nano.menu.cpu.atmega328old=ATmega328P (Old Bootloader)') {
                    insideSection = true;

                }
                if (line === '## Arduino Nano w/ ATmega168') {
                    insideSection = false;

                }
                if (insideSection === true && !(line === '') && !line.includes('#')) {
                    cFlagArr.push(line);
                }

            }
            cFlag = cFlagArr.join(" ");
        } catch (error) {
            cFlag = "Error occurred while reading the file.";
        }

        return cFlag;
    }

    /**
* Function that retrieves the recipe pattern of C++ from platform.txt
* @param filePath path to arduino hardware file
* @returns a string of the recipe pattern of C plus 
*/
    getPlatformCPlusRecipePattern() {
       // Split the content by lines
       let cFlag = "";
       let cFlagArr = [];
       let insideSection = false;
       try {
           const data = fs.readFileSync(this.pathToPlatformFile, 'utf-8');
           const dataArr = data.split('\n');
           for (const line of dataArr) {
               if (line === '## Compile c++ files') {
                   insideSection = true;

               } else if (line === '') {
                   insideSection = false;
               }

               if (!(line === '') && insideSection === true && !line.includes('#')) {
                   cFlagArr.push(line);
               }
           }
           cFlag = cFlagArr.join(" ");
       } catch (error) {
           cFlag = "Error occurred while reading the file.";
       }
       return cFlag;
    }

    /**
* Function that retrieves the recipe pattern of C in platform.txt 
* @param filePath path to arduino hardware file
* @returns a string of the recipe pattern of C
*/
    getPlatformCCompilerRecipePattern() {
        // Split the content by lines
        let cFlag = "";
        let cFlagArr = [];
        let insideSection = false;
        try {
            const data = fs.readFileSync(this.pathToPlatformFile, 'utf-8');
            const dataArr = data.split('\n');
            for (const line of dataArr) {
                if (line === '## Compile c files') {
                    insideSection = true;

                } else if (line === '') {
                    insideSection = false;

                }

                if (!(line === '') && insideSection === true && !line.includes('#')) {

                    cFlagArr.push(line);
                }
            }
            cFlag = cFlagArr.join(" ");
        } catch (error) {
            cFlag = "Error occurred while reading the file.";
        }

        return cFlag;
    }

        /**
* Function that returns the target value of flags
* @param targetFlag string of target flag
* @param flagsString string that takes in all the flags
* @returns the value of the targeted flag
*/
    getTargetFlagHelper(targetFlag: String, flagsString: String){
        let flagsInfoArr = flagsString.split(' ');
        for (const target of flagsInfoArr) {

            let variableFlagArr = target.split("=");

            let variableFlag = variableFlagArr[0];

            if (variableFlag === targetFlag) {
                return variableFlagArr[1];
            }
        }
        return "Flag not found";
    }
    //Gets all default flags of platform.txt for C recipe
    getCompilerDefaultFlagsCRecipePlatform() {
        // Split the content by lines
        let cFlag = "";
        let cFlagArr = [];
        let insideSection = false;
        try {
            const data = fs.readFileSync(this.pathToPlatformFile, 'utf-8');
            const dataArr = data.split('\n');
            for (const line of dataArr) {
                if (line === '# Default "compiler.path" is correct, change only if you want to override the initial value') {
                    insideSection = true;

                } else if (line === '') {
                    insideSection = false;

                }

                if (!(line === '') && insideSection === true && !line.includes('#')) {

                    cFlagArr.push(line);
                }
            }
            cFlag = cFlagArr.join("\n");
        } catch (error) {
            cFlag = "Error occurred while reading the file.";
        }
        
        return cFlag;
    }

    //Gets all default flags of platform.txt for C recipe
    getCompilerDefaultFlagsCPlusRecipePlatform() {
        // Split the content by lines
        let cFlag = "";
        let cFlagArr = [];
        let insideSection = false;
        try {
            const data = fs.readFileSync(this.pathToPlatformFile, 'utf-8');
            const dataArr = data.split('\n');
            for (const line of dataArr) {
                if (line === '# Default "compiler.path" is correct, change only if you want to override the initial value') {
                    insideSection = true;

                } else if (line === '') {
                    insideSection = false;

                }

                if (!(line === '') && insideSection === true && !line.includes('#')) {

                    cFlagArr.push(line);
                }
            }
            cFlag = cFlagArr.join("\n");
        } catch (error) {
            cFlag = "Error occurred while reading the file.";
        }
        
        return cFlag;
    }
    //Gets all warning flags from platform.txt
    getCompilerWarningFlagsPlatform() {
        // Split the content by lines
        let cFlag = "";
        let cFlagArr = [];
        let insideSection = false;
        try {
            const data = fs.readFileSync(this.pathToPlatformFile, 'utf-8');
            const dataArr = data.split('\n');
            for (const line of dataArr) {
                if (line === '# AVR compile variables') {
                    insideSection = true;

                } else if (line === '# Default "compiler.path" is correct, change only if you want to override the initial value') {
                    insideSection = false;

                }

                if (!(line === '') && insideSection === true && !line.includes('#')) {

                    cFlagArr.push(line);
                }
            }
            cFlag = cFlagArr.join("\n");
        } catch (error) {
            cFlag = "Error occurred while reading the file.";
        }
        
        return cFlag;
    }



}
