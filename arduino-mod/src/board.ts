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

             //testing getting c flag board.txt
            let arduinoPackagePath = ' ';
            arduinoPackagePath = path.join(basepath, 'boards.txt');
            console.log("Nano board.txt flag");
            //testing returns a string of nano flags Compile c++ flags 
            console.log(this.getBoardflagsNano(arduinoPackagePath));
            console.log("Nano platform.txt flag");
            arduinoPackagePath = '';
            arduinoPackagePath = path.join(basepath, 'platform.txt');
            console.log(this.getPlatformCPlusCompilerFlag(arduinoPackagePath));
            //testing get
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
                // let stringMatchArr = line.split('=');
                // let result = stringMatchArr[1].trim();
                // console.log('result: ' + result);
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
            for(const line of dataArr.slice(213,224)){
                // let stringMatchArr = line.split('=');
                // let result = stringMatchArr[1].trim();
                // console.log('result: ' + result);
                if(line === 'nano.menu.cpu.atmega328=ATmega328P'){
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
    getBoardMegaNanoBootloaderFlag(){

    }

          /**
 * Function that retrieves the nano compile flag within platform.txt 
 * @param filePath path to arduino hardware file
 * @returns a string compriseing of C++ flags from platform.txt
 */
    getPlatformCPlusCompilerFlag(filePath:string){
        let insideSection = false;
        // Split the content by lines
        let cFlag = "";
        let cFlagArr = [];
        try {
            const data = fs.readFileSync(filePath, 'utf-8');
            const dataArr = data.split('\n');
            for(const line of dataArr.slice(56,58)){
                if(line === '## Compile c++ files'){
                    insideSection = true;
                    console.log("Inside text");
                }
                if(line === ''){
                    insideSection = false;
                    console.log("Outside the nano");
                }
                  if(insideSection===true && !(line === '## Compile c++ files')){
                    cFlagArr.push(line);
                }

            }
            cFlag = cFlagArr.join(" ");
        } catch (error) {
            cFlag = "Error occurred while reading the file.";
        }

        return cFlag;
    }


}
