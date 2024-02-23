import { Board } from './board';


//Purpose of this class is to read the platform.txt and board.txt file and manages the format of Recipe
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
        this.initializeReplacementsCPlusflag();
	}

    private initializeReplacementsCflag(): void {
        this.replacementsCrecipe = {
            '{build.mcu}': this.board.getTargetFlagHelper("nano.menu.cpu.atmega328.build.mcu", this.board.getBoardMegaNanoFlag()),
            '{runtime.ide.version}': '10607', //these are hardcoded
            '{build.board}': this.board.getTargetFlagHelper("nano.build.board", this.board.getBoardflagsNano(this.board.getPathToBoardFile())),
            '{build.arch}': 'AVR', //these are hardcoded
            '{compiler.c.flags}':  this.getCompilerCFlagDefault(),
            '{build.f_cpu}': this.board.getTargetFlagHelper("nano.build.f_cpu", this.board.getBoardflagsNano(this.board.getPathToBoardFile()))
        };
    }

    //in progress to be updated
    private initializeReplacementsCPlusflag(): void {
        this.replacementsCPlusrecipe = {
            '{build.mcu}': this.board.getTargetFlagHelper("nano.menu.cpu.atmega328.build.mcu", this.board.getBoardMegaNanoFlag()),
            '{runtime.ide.version}': '10607',
            '{build.board}': this.board.getTargetFlagHelper("nano.build.board", this.board.getBoardflagsNano(this.board.getPathToBoardFile())),
            '{build.arch}': 'AVR',
            '{compiler.cpp.flags}': this.getCompilerCPlusFlagDefault(), //only difference are the compiler.c.flags
            '{build.f_cpu}': this.board.getTargetFlagHelper("nano.build.f_cpu", this.board.getBoardflagsNano(this.board.getPathToBoardFile()))
        };
    }
    //Function that replaces the split string value for C recipe
    replaceStringHelperCRecipe(originalString: string): string {
        for (const key in this.replacementsCrecipe) {
            if (this.replacementsCrecipe.hasOwnProperty(key)) {
                const replacement = this.replacementsCrecipe[key];
                originalString = originalString.replace(key, replacement);
            }
        }
        return originalString;
    }

     //Function that replaces the split string value C plus recipe 
     replaceStringHelperCPlusRecipe(originalString: string): string {
        for (const key in this.replacementsCPlusrecipe) {
            if (this.replacementsCPlusrecipe.hasOwnProperty(key)) {
                const replacement = this.replacementsCPlusrecipe[key];
                originalString = originalString.replace(key, replacement);
            }
        }
        return originalString;
    }
    

    /*
    funtion that will format the C compiler recipe with all needed flags
    */
    formatCCompilerBuild(cRecipeString:String): string {
        let cRecipeStringArr = cRecipeString.split(' ');
        let newFormatStringArr = [];

        for (const str of cRecipeStringArr.slice(1,7)) {
            newFormatStringArr.push(this.replaceStringHelperCRecipe(str));
        }
        let finalFormat = newFormatStringArr.join(' ');
        finalFormat = finalFormat.replace('compiler.c.flags=','');
        return finalFormat;
    }

     /*
    funtion that will format the C plus compiler recipe with all needed flags
    */
    formatCXXCompilerBuild(cRecipeString:String): string {
        let cRecipeStringArr = cRecipeString.split(' ');
        let newFormatStringArr = [];

        for (const str of cRecipeStringArr.slice(1,7)) {
            newFormatStringArr.push(this.replaceStringHelperCPlusRecipe(str));
        }
        let finalFormat = newFormatStringArr.join(' ');
        finalFormat = finalFormat.replace('compiler.cpp.flags=','');
        return finalFormat;
    }

    //Returns the format of the compiler.c.flags
    getCompilerCFlagDefault(){
        let defaultFlag = this.board.getCompilerDefaultFlagsCRecipePlatform();
        let defaultFlagArr = defaultFlag.split('\n');
        let Cflag = "";
        for(const line of defaultFlagArr){
            let flagVar = line.split('=');
            if(flagVar[0] === "compiler.c.flags"){
                Cflag = flagVar[1] + "=" + flagVar[2];
            }
        }
        let targetValue = "";
        let warningArr = this.board.getCompilerWarningFlagsPlatform().split("\n")
        for (const line of warningArr){
            let flag = line.split("=");
            if(flag[0] === "compiler.warning_flags"){
                targetValue = flag[1];
            }
        }
        let newFormat = Cflag.replace("{compiler.warning_flags}",targetValue);
        newFormat = newFormat.replace('-c', '');
        newFormat = newFormat.replace('-fno-fat-lto-objects', '-fno-fat-lto-objects -ffat-lto-objects');
        return newFormat;
    }

    //Returns the format of the compiler.cpp.flags
    getCompilerCPlusFlagDefault(){
        let defaultFlag = this.board.getCompilerDefaultFlagsCRecipePlatform();
        let defaultFlagArr = defaultFlag.split('\n');
        let Cflag = "";
        for(const line of defaultFlagArr){
            let flagVar = line.split('=');
            if(flagVar[0] === "compiler.cpp.flags"){
                Cflag = flagVar[1] + "=" + flagVar[2] + "=" + flagVar[3];
            }
        }
        let targetValue = "";
        //replace {compiler.warning_flags} with -w from platform.txt 
        let warningArr = this.board.getCompilerWarningFlagsPlatform().split("\n")
        for (const line of warningArr){
            let flag = line.split("=");
            if(flag[0] === "compiler.warning_flags"){
                targetValue = flag[1];
            }
        }
        let newFormat = Cflag.replace("{compiler.warning_flags}",targetValue);
        newFormat = newFormat.replace('-c', '');
        newFormat = newFormat.replace('-flto','-flto -fno-fat-lto-objects -ffat-lto-objects');
        return newFormat;
    }



    


}
