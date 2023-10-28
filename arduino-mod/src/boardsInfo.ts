import * as vscode from 'vscode';


export const UNO = "UNO"; //none 
export const NANO = "Nano"; //ATmega328P or ATmega328P (Old Bootloader) 
export const MEGA = "Mega or Mega2560"; //ATMega2560; ATMega1280 
export const PRO = "Pro or Pro Mini"; //ATmega328P (5V, 16 MHz); ATmega328P (3.3V, 8 MHz) 

export function getBoardOptions(board: string): string[] {
    const result: string[] = [];
    if (board === NANO) {
        result.push("ATmega328P or ATmega328P (Old Bootloader)");
    }
    else if (board === MEGA) {
        result.push("ATMega2560");
        result.push("ATMega1280");
    }
    else if (board === PRO) {
        result.push("ATmega328P (5V, 16 MHz)");
        result.push("ATmega328P (3.3V, 8 MHz)");
    }
    return result;

}

