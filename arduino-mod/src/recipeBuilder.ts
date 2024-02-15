import { Board } from './board';


//Purpose of this class is to read the platform.txt and board.txt file 
//and return the format of the recipes in the platform.txt 
// eslint-disable-next-line @typescript-eslint/naming-convention
export class Recipe {
    private board: Board;

    //key being the variable thats being replaced and value being the update variable thats being placed
    private replacementsCrecipe: { [key: string]: string; } | undefined; // Define replacements property
    private replacementsCPlusrecipe: { [key: string]: string; } | undefined;
    constructor(board: Board){
        this.board = board;
        this.initializeReplacementsCflag();
       
	}

    private initializeReplacementsCflag(): void {
        this.replacementsCrecipe = {
            '{build.mcu}': this.board.getTargetBoardFlagHelper("nano.menu.cpu.atmega328.build.mcu", this.board.getBoardMegaNanoFlag()),
            '{runtime.ide.version}': '10607', //these are hardcoded
            '{build.board}': this.board.getTargetBoardFlagHelper("nano.build.board", this.board.getBoardflagsNano(this.board.getPathToBoardFile())),
            '{build.arch}': 'AVR', //these are hardcoded
            //'{compiler.c.flags}': 'compiler.c.flags=-c -g -Os -w -std=gnu11 -ffunction-sections -fdata-sections -MMD -flto -fno-fat-lto-objects',
            //'{build.arch}': this.board.getTargetBoardFlagHelper("compiler.c.flags",),
            '{build.f_cpu}': this.board.getTargetBoardFlagHelper("nano.build.f_cpu", this.board.getBoardflagsNano(this.board.getPathToBoardFile()))
        };
    }

    //in progress
    private initializeReplacementsCPlusflag(): void {
        this.replacementsCPlusrecipe = {
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
        for (const key in this.replacementsCrecipe) {
            if (this.replacementsCrecipe.hasOwnProperty(key)) {
                const replacement = this.replacementsCrecipe[key];
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
        finalFormat = finalFormat.replace('compiler.c.flags=','');
        return finalFormat;
    }
    //gets the compiler.c.flags along wtih getting the warning flag 
    getCompilerCFlagDefault(){
        let defaultFlag = this.board.getCompilerDefaultFlagsPlatform();
        let defaultFlagArr = defaultFlag.split('\n');
        let finalCflag = "";
        for(const line of defaultFlagArr){
            console.log("Default flag " + line + "\n");
            let flagVar = line.split('=');
            if(flagVar[0] === "compiler.c.flags"){
                console.log(flagVar)
                finalCflag = flagVar[1] + "=" + flagVar[2];
                
            }

            console.log(defaultFlagArr.length);
        }
        // this.board.getTargetBoardFlagHelper();

        console.log("Final flag \n" + finalCflag);
    }

    


}
