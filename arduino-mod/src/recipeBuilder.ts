import { Board } from './board';


//Purpose of this class is to read the platform.txt and board.txt file 
//and return the format of the recipes in the platform.txt 
// eslint-disable-next-line @typescript-eslint/naming-convention
export class Recipe {
    private board: Board;

    //key being the variable thats being replaced and value being the update variable thats being placed
    private replacements: { [key: string]: string }; // Define replacements property
    constructor(board: Board){
        this.board = board;
        this.replacements = {
            '{build.mcu}': 'atmega328p',
            '{runtime.ide.version}': '10607',
            '{build.board}': 'AVR_NANO',
            '{build.arch}': 'AVR',
            '{compiler.c.flags}': 'compiler.c.flags=-c -g -Os {compiler.warning_flags} -std=gnu11 -ffunction-sections -fdata-sections -MMD -flto -fno-fat-lto-objects',
        };
       
	}

    public replaceVariables(recipeString: string): string {
    // Construct a regular expression to match strings within {}
    const regex = /{([^}]+)}/g;
    // Replace each matched string with the corresponding value from the replacements object
    return recipeString.replace(regex, (match, key) => {
        // If the key exists in replacements, return its value; otherwise, return the original match
        return this.replacements.hasOwnProperty(key) ? this.replacements[key] : match;
    });

    }



    /*
    funtion that will format the C compiler recipe with all needed flags
    */
    formatCCompilerBuild(cRecipeString:String): String {

        console.log(this.board.getTargetBoardFlagHelper( "nano.build.variant",this.board.getBoardflagsNano(this.board.getPathToBoardFile())));


        let cRecipeStringArr = cRecipeString.split(' ');
        let newFormatStringArr = [];
        
        console.log("\nPrinting out recipe \n");

        for (const str of cRecipeStringArr.slice(2,7)) {
            let splitStr = str.split("=");
            if(this.replacements.hasOwnProperty(splitStr[0])){
                
            }
            const replacedString = str.replace("{build.mcu}", "avr");
            newFormatStringArr.push(str);
            console.log(str);
        }
        return "";
    }


}
