import { Board } from './board';


//Purpose of this class is to read the platform.txt and board.txt file 
//and return the format of the recipes in the platform.txt 
// eslint-disable-next-line @typescript-eslint/naming-convention
export class Recipe {
    private board: Board;

    //key being the variable thats being replaced and value being the update variable thats being placed
    private replacements: { [key: string]: string; } | undefined; // Define replacements property
    constructor(board: Board){
        this.board = board;
        this.initializeReplacementsCflag();
       
	}

    private initializeReplacementsCflag(): void {
        this.replacements = {
            '{build.mcu}': this.board.getTargetBoardFlagHelper("nano.menu.cpu.atmega328.build.mcu", this.board.getBoardMegaNanoFlag()),
            '{runtime.ide.version}': '10607',
            '{build.board}': this.board.getTargetBoardFlagHelper("nano.build.board", this.board.getBoardflagsNano(this.board.getPathToBoardFile())),
            '{build.arch}': 'AVR',
            '{compiler.c.flags}': 'compiler.c.flags=-c -g -Os -w -std=gnu11 -ffunction-sections -fdata-sections -MMD -flto -fno-fat-lto-objects',
            '{build.f_cpu}': this.board.getTargetBoardFlagHelper("nano.build.f_cpu", this.board.getBoardflagsNano(this.board.getPathToBoardFile()))
        };
    }
    private initializeReplacementsCPlausflag(): void {
        this.replacements = {
            '{build.mcu}': this.board.getTargetBoardFlagHelper("nano.menu.cpu.atmega328.build.mcu", this.board.getBoardMegaNanoFlag()),
            '{runtime.ide.version}': '10607',
            '{build.board}': this.board.getTargetBoardFlagHelper("nano.build.board", this.board.getBoardflagsNano(this.board.getPathToBoardFile())),
            '{build.arch}': 'AVR',
            '{compiler.c.flags}': 'compiler.c.flags=-c -g -Os -w -std=gnu11 -ffunction-sections -fdata-sections -MMD -flto -fno-fat-lto-objects',
            '{build.f_cpu}': this.board.getTargetBoardFlagHelper("nano.build.f_cpu", this.board.getBoardflagsNano(this.board.getPathToBoardFile()))
        };
    }
    //Function that replaces the split string 
    replaceStringHelper(originalString: string): string {
        for (const key in this.replacements) {
            if (this.replacements.hasOwnProperty(key)) {
                const replacement = this.replacements[key];
                originalString = originalString.replace(key, replacement);
            }
        }
        return originalString;
    }



    /*
    funtion that will format the C compiler recipe with all needed flags
    */
    formatCCompilerBuild(cRecipeString:String): String {


        let cRecipeStringArr = cRecipeString.split(' ');
        let newFormatStringArr = [];

        for (const str of cRecipeStringArr.slice(1,7)) {
            newFormatStringArr.push(this.replaceStringHelper(str));
        }
        let finalFormat = newFormatStringArr.join(' ');

        return finalFormat;
    }


}
