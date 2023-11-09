import * as vscode from 'vscode';
import * as parser from './parser';
import * as path from 'path';


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
    private pathToCore: string = "";


    constructor(boardName: string) {
        this.boardName = boardName;

        if(boardName === NANO) {
            this.hardCodedFlags = "-DARDUINO_ARCH_MEGAAVR -DARDUINO=10607 -Wall -Wextra -DF_CPU=24000000L";
            this.chipName = "avrdd";
            this.options.push("ATmega328P or ATmega328P (Old Bootloader)");
            
            const localAppData = process.env.LOCALAPPDATA;
            const version = parser.getDXCoreVersion();
                if (localAppData) {
                this.pathToCore = path.join(localAppData, "Arduino15", "packages", "DxCore","hardware","megaavr",version,"cores","dxcore");
                }
        } else if (boardName === MEGA) {
            this.options.push("ATMega2560");
            this.options.push("ATMega1280");
        } else if (boardName === PRO) {
            this.options.push("ATmega328P (5V, 16 MHz)");
            this.options.push("ATmega328P (3.3V, 8 MHz)");
        }
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

    getPathToCore() {
        return this.pathToCore;
    }

}
