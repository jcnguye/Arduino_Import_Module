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
export class Board {
    boardName: string;
    private hardCodedFlags: string = "";
    private chipName: string = "";
    allFlags: string = "";
    options: string[] = [];
    private corePaths: string[] = []; //list of all necessary core related libraries that need to be copied for each board
    private pathToCompiler: string = "";


    constructor(boardName: string) {
        this.boardName = boardName;
        var localAppData = "???";
		if(process.platform === "win32") {
			localAppData = path.join(process.env.LOCALAPPDATA!, "Arduino15")
		} else if(process.platform === "darwin") {
			localAppData = path.join(process.env.HOME, "Library", "Arduino15")
		} else if(process.platform === "linux") {
			localAppData = path.join(process.env.HOME, ".arduino15")
		}
        if(boardName === NANO) {
            this.hardCodedFlags = "-DARDUINO_ARCH_MEGAAVR -DARDUINO=10607 -Wall -Wextra -DF_CPU=24000000L"; //TODO - Update for Nano
            this.chipName = "avrdd"; //TODO - Update for Nano
            this.options.push("ATmega328P or ATmega328P (Old Bootloader)");          
             
            if (localAppData) {
                this.pathToCompiler = path.join(localAppData,"packages","arduino","tools","avr-gcc");
                const compilerVersion = this.mostRecentDirectory(this.pathToCompiler); 
                this.pathToCompiler = path.join(this.pathToCompiler, compilerVersion); 

                //TODO - Update core paths for Nano
                const version = parser.getDXCoreVersion(); //TODO - Update for Nano
                this.corePaths.push(path.join(localAppData, "packages", "DxCore","hardware","megaavr",version,"cores","dxcore"));
                this.corePaths.push(path.join(localAppData, "packages", "DxCore","hardware","megaavr",version,"variants","32pin-ddseries"));
            }
        } else if (boardName === MEGA) {
            this.options.push("ATMega2560");
            this.options.push("ATMega1280");
        } else if (boardName === PRO) {
            this.options.push("ATmega328P (5V, 16 MHz)");
            this.options.push("ATmega328P (3.3V, 8 MHz)");
        }

        /** THIS IS WHAT WAS PREVIOUSLY USED FOR THE DXCORE 1/21/24
         * 
         * this.hardCodedFlags = "-DARDUINO_ARCH_MEGAAVR -DARDUINO=10607 -Wall -Wextra -DF_CPU=24000000L";
            this.chipName = "avrdd";
            this.options.push("ATmega328P or ATmega328P (Old Bootloader)");
            
            const localAppData = process.env.LOCALAPPDATA;
            const version = parser.getDXCoreVersion();
            if (localAppData) {
                this.pathToCompiler = path.join(localAppData,"Arduino15","packages","DxCore","tools","avr-gcc");
                const compilerVersion = this.mostRecentDirectory(this.pathToCompiler);
                this.pathToCompiler = path.join(this.pathToCompiler, compilerVersion);

                this.corePaths.push(path.join(localAppData, "packages", "DxCore","hardware","megaavr",version,"cores","dxcore"));
                this.corePaths.push(path.join(localAppData, "packages", "DxCore","hardware","megaavr",version,"variants","32pin-ddseries"));
                this.corePaths.push(path.join(localAppData, "packages", "DxCore","tools","avr-gcc",compilerVersion,"avr","include"));
            }
        */
    }

    getBoardName() {
        return this.boardName;
    }

    getHardcodedFlags() {
        return this.hardCodedFlags;
    }

    getChipName() {
        return this.chipName;
    }

    setAllFlags(allFlags: string) {
        this.allFlags = allFlags;
    }

    getAllFlags() {
        return this.allFlags;
    }

    getCorePaths() {
        return this.corePaths;
    }

    getPathToCompiler() {
        return this.pathToCompiler;
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
