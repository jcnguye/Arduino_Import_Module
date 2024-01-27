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
    private corePaths: string[] = []; //list of all necessary core related libraries that need to be copied for each board
    private pathToCompiler: string = "";


    constructor(boardName: string) {
        this.boardName = boardName;

        if(boardName === NANO) {
            this.nanoBuild();
        } else if (boardName === DXCORE) {
            this.dxcoreBuild();
        }else if (boardName === MEGA) {
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
        this.options.push("ATmega328P or ATmega328P (Old Bootloader)");

        const localAppData = process.env.LOCALAPPDATA;

        if (localAppData) {
            this.pathToCompiler = path.join(localAppData,"packages","arduino","tools","avr-gcc");
            const compilerVersion = this.mostRecentDirectory(this.pathToCompiler); 
            this.pathToCompiler = path.join(this.pathToCompiler, compilerVersion);
        }
    }
   

    dxcoreBuild(): void{
        this.setFlag("-DARDUINO_ARCH_MEGAAVR -DARDUINO=10607 -Wall -Wextra -DF_CPU=24000000L") ;
        this.chipName = "avrdd";
        // TODO - determine board options that should be supported for the DxCore 

        const localAppData = process.env.LOCALAPPDATA;
        const version = parser.getDXCoreVersion();
        
            if (localAppData) {
                this.pathToCompiler = path.join(localAppData,"Arduino15","packages","DxCore","tools","avr-gcc");
                const compilerVersion = this.mostRecentDirectory(this.pathToCompiler);
                this.pathToCompiler = path.join(this.pathToCompiler, compilerVersion);

                this.corePaths.push(path.join(localAppData, "Arduino15", "packages", "DxCore","hardware","megaavr",version,"cores","dxcore"));
                this.corePaths.push(path.join(localAppData, "Arduino15", "packages", "DxCore","hardware","megaavr",version,"variants","32pin-ddseries"));
                this.corePaths.push(path.join(localAppData, "Arduino15", "packages", "DxCore","tools","avr-gcc",compilerVersion,"avr","include"));
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

}
