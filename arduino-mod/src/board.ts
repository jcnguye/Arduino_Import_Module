import * as vscode from 'vscode';
import * as parser from './parser';
import * as path from 'path';
import * as fs from 'fs';

export const UNO = "UNO"; //none 
export const NANO = "Nano"; //ATmega328P or ATmega328P (Old Bootloader) 
export const MEGA = "Mega or Mega2560"; //ATMega2560; ATMega1280 
export const PRO = "Pro or Pro Mini"; //ATmega328P (5V, 16 MHz); ATmega328P (3.3V, 8 MHz) 
export const DXCORE = "DxCore";

export function getAllBoards(): string[] {
    const result = [UNO, NANO, MEGA, PRO, DXCORE];
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
        this.options.push("ATmega328P or ATmega328P (Old Bootloader)");          
             
        if (localAppData) {
            this.pathToCompiler = path.join(localAppData,"packages","arduino","tools","avr-gcc");

            let compilerVersion = "";
            
            try {
                compilerVersion = this.mostRecentDirectory(this.pathToCompiler); 
            } catch(error) {
                compilerVersion = "7.3.0-atmel3.6.1-arduino7"
            }
            
            this.pathToCompiler = path.join(this.pathToCompiler, compilerVersion); 
            
          	const basepath = path.join(localAppData, "packages", "arduino", "hardware", "avr", parser.getNanoVersion());
            	
            this.corePaths.push([path.join(basepath, "cores", "arduino"), "core"]);
            this.corePaths.push([path.join(basepath, "variants", "eightanaloginputs"), path.join("core", "eightanaloginputs")]);
            this.corePaths.push([path.join(basepath, "variants", "standard"), path.join("core", "standard")]);
        }

    }
   

    dxcoreBuild(localAppData:string): void{
        this.setFlag("-DARDUINO_ARCH_MEGAAVR -DARDUINO=10607 -Wall -Wextra -DF_CPU=24000000L") ;
        this.chipName = "avrdd";
        this.options.push("ATmega328P or ATmega328P (Old Bootloader)");

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

    megaBuild(localAppData:string): void{
        this.options.push("ATMega2560");
        this.options.push("ATMega1280");
    }

    proBuild(localAppData:string): void{
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
        console.log(dirPath);
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
