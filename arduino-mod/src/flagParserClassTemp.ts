import * as vscode from 'vscode';
import * as fs from 'fs';

const cRecipe = 'recipe.c.combine.pattern';


export class flagParser {
    constructor() {}


    /**
     * Function to obtain and return the compiler flags in platform.txt and boards.txt for a 
     * given recipe. This function should work for all Arduino boards. 
     * 
     * @param recipeName The name of the recipe to obtain in platform.txt
     * @param boardOptionsAndName An array of the board name and options. Must match the start of
     * the all relevant flags from boards.txt. Must contain a period at the end of each string. 
     * (Ex. 'nano.' or 'nano.menu.cpu.atmega328.')
     * @param platformPath The path to platform.txt 
     * @param boardPath The path to boards.txt
     * @param hardcodedFlags A map of any hardcoded flags that are not supplied in boards.txt or
     * platform.txt
     * @returns Compiler flags for the given recipe
     */
    obtainFlags(recipeName: string, boardOptionsAndName: string[], platformPath: string, boardPath: string, hardcodedFlags?: Map<string, string>): string {
        let recipeTemplate = obtainRecipeTemplate(recipeName, platformPath);
        let flagMap = this.obtainFlagMap(platformPath, boardPath, boardOptionsAndName);

        // if there are hardcoded flags, add them to the flagMap
        if (hardcodedFlags) {
            flagMap = new Map([...flagMap, ...hardcodedFlags]);
        }
        const flags = this.interpretRecipe(recipeTemplate, flagMap);
        return flags;
    }

    /** 
     * Private helper function. Returns recipe template from platform.txt.
     */ 
    private obtainRecipeTemplate(recipeName: string, platformPath:string): string {
        let result = '';
        try {
            const data = fs.readFileSync(platformPath, 'utf8');
            const lines = data.split('\n');
            const fullRecipe = lines.find(line => line.startsWith(recipeName));
            if (fullRecipe) {
                //eliminating recipe portions that include the compiler path, source & output files. (cmake has it's own syntax for those variables) 
                const tokens = fullRecipe.split('"');
                result = tokens[2];
            }
        } catch (err) {
            console.error('Error reading file:', err);
        }
        return result;
    }

    /**
     * Private helper function. Parses platform.txt and board.txt and returns a map of all relevant flags.
     */
    private obtainFlagMap(platformPath: string, boardPath: string, boardOptionsAndName: string[]): Map<string, string>{
        const flagMap = new Map<string, string>();
        let platformData = '';
        try {
            platformData = fs.readFileSync(platformPath, 'utf8');
        } catch (err) {
            console.error('Error reading file:', err);
        }

        if (platformData) {
            const lines = platformData.split('\n');
            lines.forEach(line => {
                const index = line.indexOf('=');
                if (index !== -1) {
                    const key = line.substring(0, index);
                    const value = line.substring(index + 1);
                    flagMap.set(key, value);
                }
            });
        }

        let boardData = '';
        try {
            boardData = fs.readFileSync(boardPath, 'utf8');
        } catch (err) {
            console.error('Error reading file:', err);
        }
        if (boardData) {
            const lines = boardData.split('\n');
            lines.forEach(line => {
                const index = line.indexOf('=');  				
                if (index !== -1) {
                    boardOptionsAndName.forEach(opt => {
                        if (line.startsWith(opt)) {
                            let key = line.substring(0, index);
                            const value = line.substring(index + 1);
                            key = key.replace(opt, ''); //remove the board or option from the beginning of they key 
                            flagMap.set(key, value);
                        }
                    });
                }
            });
        }

        return flagMap;
    }

    /**
     * Private helper function. Replaces all variables in the recipe template with the appropriate value
     * from the flagMap. Not recurrsive. Continues iterating through flag map until no replacements are 
     * made for a full iteration.
     * (Ex. replace {compiler.c.flags} with '-c -g ...' )
     */
    private interpretRecipe(recipeTemplate: string, flagMap: Map<string, string>): string {
        let recipe = recipeTemplate;
        let replacementCount = 1; // initialize to an arbitrary value greater than 0

        // Repeat until no replacements are made (handles nested flags & avoids recursion)
        while (replacementCount > 0 ) {
            replacementCount = 0;

            // for each element in the flag map
            flagMap.forEach((value, key) => {	
                // if the recipe template contains the flag map key
                if (recipe.includes(key)) {
                    // replace the {key} with the flag map value
                    recipe = recipe.replace('{' + key + '}', value);
                    // count the number of replacements made
                    replacementCount++;	
                }
            });
        }

        return recipe;
    }
}

