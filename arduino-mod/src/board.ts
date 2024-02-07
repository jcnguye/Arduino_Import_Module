import * as vscode from 'vscode';
import * as parser from './parser';
import * as path from 'path';
import * as fs from 'fs';

export const UNO = "UNO"; //none 
export const NANO = "Nano"; //ATmega328P or ATmega328P (Old Bootloader) 
export const MEGA = "Mega or Mega2560"; //ATMega2560; ATMega1280 
export const PRO = "Pro or Pro Mini"; //ATmega328P (5V, 16 MHz); ATmega328P (3.3V, 8 MHz) 

export function getAllBoards(): string[] {
    const result = [UNO, NANO, MEGA, PRO];
    return result;
}
export function getBoard(boardName: string): Board {
    return new Board(boardName);
}

/**
 * Board class that stores hardcoded data for each board
 */
export class Board{
    boardName: string;
    private flags: string = "";
    private chipName: string = "";
    options: string[] = [];
    private corePaths: [string, string][] = []; // tuple of core lib path and ./core/ dest
    private pathToCompiler: string = "";


    constructor(boardName: string) {
        this.boardName = boardName;


        if(boardName === NANO) {
            this.nanoBuild();
        } else if (boardName === MEGA) {
            this.megaBuild();
        } else if (boardName === PRO) {
            this.proBuild();
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
    setBoardName(boardName:string):void{
        this.boardName = boardName;
    }
    setFlag(flag:string):void{
        this.flags = flag;
    }
    setChipName(chipName:string):void{
        this.chipName = chipName;
    }

    nanoBuild(): void {
        var localAppData = "???";
		if(process.platform === "win32") {
			localAppData = path.join(process.env.LOCALAPPDATA!, "Arduino15");
		} else if(process.platform === "darwin") {
			localAppData = path.join(process.env.HOME!, "Library", "Arduino15");
		} else if(process.platform === "linux") {
			localAppData = path.join(process.env.HOME!, ".arduino15");
		}

        this.options.push("ATmega328P or ATmega328P (Old Bootloader)");          
             
        if (localAppData) {
            this.pathToCompiler = path.join(localAppData,"packages","arduino","tools","avr-gcc");
            const compilerVersion = this.mostRecentDirectory(this.pathToCompiler); 
            this.pathToCompiler = path.join(this.pathToCompiler, compilerVersion); 
            
          	const basepath = path.join(localAppData, "packages", "arduino", "hardware", "avr", parser.getNanoVersion());
            this.corePaths.push([path.join(basepath, "cores", "arduino"), "core"]);
            this.corePaths.push([path.join(basepath, "variants", "eightanaloginputs"), path.join("core", "eightanaloginputs")]);
            this.corePaths.push([path.join(basepath, "variants", "standard"), path.join("core", "standard")]);

            var arduinoPackagePathBoard = path.join(basepath, 'boards.txt');
            var arduinoPackagePathPlatform = path.join(basepath, 'platform.txt');
            //Testing if platform and board is being read
            // let arduinoPackagePath = ' ';
            console.log("---------- Nano board.txt flag -------");
            console.log(this.getBoardflagsNano(arduinoPackagePathBoard));
            console.log("---------- END OF Nano board.txt flag -------");
            //testing getBoardMegaNanoFlag function 
            console.log("---------- Nano Mega nano board.txt flag -------");
            console.log(this.getBoardMegaNanoFlag(arduinoPackagePathBoard));
            console.log("---------- END OF Mega nano board.txt flag -------");
            //testing getBoardMegaNanoFlagBootLoader
            console.log("---------- Nano Mega nano Bootloader board.txt flag -------");
            console.log(this.getBoardMegaNanoBootloaderFlag(arduinoPackagePathBoard));
            console.log("---------- END OF Mega nano Bootloader board.txt flag -------");

            //testing platform file c++ flag
            console.log("--------- Nano platform.txt C++ flag ----------");
            console.log(this.getPlatformCPlusRecipePattern(arduinoPackagePathPlatform));
            console.log("--------- END OF Nano platform.txt C++ flag ----------");
            //testing platform file c flag
            console.log("--------- Nano platform.txt C flag ----------");
            console.log(this.getPlatformCCompilerRecipePattern(arduinoPackagePathPlatform));
            console.log("--------- END OF Nano platform.txt C flag ----------");
            this.formatCCompiler(this.getPlatformCCompilerRecipePattern(arduinoPackagePathPlatform))
        }

    }
   

    dxCoreBuild(): void{
        this.setFlag("-DARDUINO_ARCH_MEGAAVR -DARDUINO=10607 -Wall -Wextra -DF_CPU=24000000L") ;
        this.setChipName("avrdd");
        this.options.push("ATmega328P or ATmega328P (Old Bootloader)");

        const localAppData = process.env.LOCALAPPDATA;
        const version = parser.getDXCoreVersion();
        
            if (localAppData) {
                this.pathToCompiler = path.join(localAppData,"Arduino15","packages","DxCore","tools","avr-gcc");
                const compilerVersion = this.mostRecentDirectory(this.pathToCompiler);
                this.pathToCompiler = path.join(this.pathToCompiler, compilerVersion);
                this.corePaths.push([path.join(localAppData, "packages", "DxCore","hardware","megaavr",version,"cores","dxcore"), "core"]);
                
                //TODO - determine which variants are needed & correct path
                //this.corePaths.push(path.join(localAppData, "packages", "DxCore","hardware","megaavr",version,"variants","32pin-ddseries"));
                //this.corePaths.push(path.join(localAppData, "packages", "DxCore","tools","avr-gcc",compilerVersion,"avr","include"));
            }
    }

    megaBuild(): void{
        this.options.push("ATMega2560");
        this.options.push("ATMega1280");
    }

    proBuild(): void{
        this.options.push("ATmega328P (5V, 16 MHz)");
        this.options.push("ATmega328P (3.3V, 8 MHz)");
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

      /**
 * Function that retrieves information of nano boards flags within board.txt 
 * @param filePath Path to arduino hardware file
 * @returns a string compriseing of information on the nano board flags
 */
    getBoardflagsNano(filePath:string): string {
        let insideSection = false;
        // Split the content by lines
        let cFlag = "";
        let cFlagArr = [];
        try {
            const data = fs.readFileSync(filePath, 'utf-8');
            const dataArr = data.split('\n');
            for(const line of dataArr.slice(192,211)){
                if(line === 'nano.name=Arduino Nano'){
                    insideSection = true;
                    console.log("Inside the nano read");
                }
                if(line === '## Arduino Nano w/ ATmega328P'){
                    insideSection = false;
                    console.log("Outside the nano read");
                }
                  if(insideSection===true && !(line === '')){
                    cFlagArr.push(line);
                }

            }
            cFlag = cFlagArr.join(" ");
        } catch (error) {
            cFlag = "Error occurred while reading the file.";
        }

        return cFlag;
    }
    getBoardMegaNanoFlag(filePath:string): string {
        let insideSection = false;
        // Split the content by lines
        let cFlag = "";
        let cFlagArr = [];
        try {
            const data = fs.readFileSync(filePath, 'utf-8');
            const dataArr = data.split('\n');
            for(const line of dataArr.slice(213,226)){
                if(line === 'nano.menu.cpu.atmega328=ATmega328P'){
                    insideSection = true;
                    console.log("Inside the nano read");
                }
                if(line === '## Arduino Nano w/ ATmega328P (old bootloader)'){
                    insideSection = false;
                    console.log("Outside the nano read");
                }
                  if(insideSection===true && !(line === '')){
                    cFlagArr.push(line);
                }

            }
            cFlag = cFlagArr.join(" ");
        } catch (error) {
            cFlag = "Error occurred while reading the file.";
        }

        return cFlag;
    }

    getBoardMegaNanoBootloaderFlag(filePath:string): string {
        let insideSection = false;
        // Split the content by lines
        let cFlag = "";
        let cFlagArr = [];
        try {
            const data = fs.readFileSync(filePath, 'utf-8');
            const dataArr = data.split('\n');
            for(const line of dataArr.slice(228,241)){
                if(line === 'nano.menu.cpu.atmega328old=ATmega328P (Old Bootloader)'){
                    insideSection = true;
                    console.log("Inside the nano read");
                }
                if(line === '## Arduino Nano w/ ATmega168'){
                    insideSection = false;
                    console.log("Outside the nano read");
                }
                  if(insideSection===true && !(line === '')){
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
    getPlatformCPlusRecipePattern(filePath:string): string {
        // Split the content by lines
        let cFlag = "";
        let cFlagArr = [];
        try {
            const data = fs.readFileSync(filePath, 'utf-8');
            const dataArr = data.split('\n');
            for(const line of dataArr.slice(57,58)){
                if(!(line === '')){
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
    getPlatformCCompilerRecipePattern(filePath:string): string {
        // Split the content by lines
        let cFlag = "";
        let cFlagArr = [];
        try {
            const data = fs.readFileSync(filePath, 'utf-8');
            const dataArr = data.split('\n');
            for(const line of dataArr.slice(54,56)){
                if(!(line === '')){
                    cFlagArr.push(line);
                }
            }
            cFlag = cFlagArr.join(" ");
        } catch (error) {
            cFlag = "Error occurred while reading the file.";
        }
    
        return cFlag;
    }
    /*
    funtion that will format the C compiler recipe with all needed flags
    */
    formatCCompiler(cRecipeString:String): string {
        let cRecipeStringArr = cRecipeString.split(' ');
        for (const str of cRecipeStringArr) {
            console.log(str);
        }
    
        return "";
    }
    


}
