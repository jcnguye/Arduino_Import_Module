import * as vscode from 'vscode';
import * as readline from 'readline';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Parses the platform.txt file and pulls out all the compiler flags
 * @param filePath - directory to platform.txt file
 * @returns Array of all the compiler flags
 */
async function parsePlatform(filePath:string) {
    var flagArr: string[] = [];
    try {
        ////// separate text file into readable lines
        const lines: string[] = [];
        const fileStream = fs.createReadStream(path.join(filePath, 'platform.txt'));
        const rl = readline.createInterface({
            input: fileStream,
            crlfDelay: Infinity,
        });
        for await (const line of rl) {
            lines.push(line);
        }
        ////// get all the compiler flag lines
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i].substring(0, lines[i].indexOf('='));
            if (line.includes("compiler.") || line.includes(".flags") || line.includes("recipe.") || line.includes("build")) {
                flagArr.push(lines[i]);
            }
        }
    } catch (error) {
        flagArr = ["Error occurred while reading the file."];
    }
    return flagArr;
}

/**
 * Parses the passed in boards.txt file and creates a map of
 * the setting name and associated value(s)
 * 
 * @param filepath to boards.txt
 * @returns hashmap of options and values
 */
function parseBoards(filepath: string, boardName: string): Promise<Map<string, string>>{
    return new Promise((resolve, reject) => {
        const map = new Map();
        const fileStream = fs.createReadStream(filepath);

        const rl = readline.createInterface({
            input: fileStream,
            crlfDelay: Infinity,
        });

        const regex = /[^#]*=/
       
        rl.on('line', (line) => {
        
            const matches = line.match(regex);

            if(matches) {
                var str = line;
                var mapValues = str.split('=',2);
                
                if(mapValues[0].includes(boardName)) {
                    map.set(mapValues[0],mapValues[1]);
                }
                
            }
            
        });

        rl.on('close', () => {
            resolve(map);
          });

    });
}

/**
 * Gets the compiler flags out of the platform.txt file
 */
export async function getCompileFlags() {
    // get platform.txt file to parse
    const filePath = await vscode.window.showInputBox({
        placeHolder: "Compiler Flags",
        prompt: "Enter path to 'platform.txt' file",
    });
    if (filePath){
        // make sure file is valid
        var flagArr = await parsePlatform(filePath);
        var flagStr = "";
        for (var i = 0; i < flagArr.length; i++) flagStr += flagArr[i] + ',\n';
        vscode.window.showInformationMessage(flagStr, {modal: true});
    } else {
        vscode.window.showInformationMessage("Not a valid path or directory does not contain platform.txt file.");
    }
}


/**
 * Gets all flags for specified platform by matching key-value pairs in board.txt and 
 * platform.txt
 * 
 * @param version specific version of dxcore installed, e.g. "1.5.11"
 * @param platform specific platform, e.g. "avrdd"
 * @returns string of all flags, e.g. "-Wall -fpermissive"
 */
export async function getAllFlags(version: string, platform: string): Promise<string> {
    try {
        const hardCodedFlags = "-DARDUINO_ARCH_MEGAAVR -DARDUINO=10607 -Wall -Wextra -DF_CPU=24000000L";

        //getting map for boards.txt
        const localAppData = process.env.LOCALAPPDATA;
        const libraryFilePath = path.join(localAppData, "Arduino15", "packages", "DxCore","hardware","megaavr",version,"boards.txt");
        const map = await parseBoards(libraryFilePath, platform);

        //getting array of platform.txt
        let platform_folder = path.join(localAppData, "Arduino15", "packages", "DxCore","hardware","megaavr",version);
        let array = await parsePlatform(platform_folder);

        let cppPatternIndex = 0;
        let recipe = "recipe.cpp.o.pattern";
        

        //finding cpp recipe line
        for(let i =0; i < array.length; i++) {
            if(array[i].includes(recipe)) {
                cppPatternIndex = i;
                // console.log(array[i]);
                break;
            }
        }
        
        //getting all flags and variables from line
        let optionString = array[cppPatternIndex].substring(recipe.length+1,array[cppPatternIndex].length);
        let optionArray = optionString.split(" ");

        let variables: string[] = [];   //{variable}, without {}
        let standAloneFlags = [];       //eg. -flag
        let flagAndVariables: string[] = [];      //mmcu={variable}, with {}

        //iterating through paltform.txt array for variables
        for(let i = 0; i < optionArray.length; i++) {
            let str = optionArray[i];
            
            if(str.includes("=") && str.includes("{")) {
                flagAndVariables.push(optionArray[i]);
            }
            //filtering for relevant simple variables
            if(str.includes("{") && !str.includes("source_file") && !str.includes("includes") && 
                !str.includes("source_files") && !str.includes("object_file") && !str.includes("core.path") && !str.includes("compiler.path")) {
                variables.push(optionArray[i].substring(1,optionArray[i].length-1))
            }
        }

        //reiterating through platform.txt for variables defined in platform.txt
        for(let i = 0; i < array.length; i++) {
            let equalIndex = array[i].indexOf("=");

            let value = array[i].substring(0,equalIndex);
            let options = array[i].substring(equalIndex+1,array[i].length);

            let index = variables.indexOf(value);
            if(index != -1) {
                
                let parsedOptions = options.split(" ");
                
                for(let x = 0; x < parsedOptions.length; x++) {
                    let opt = parsedOptions[x];
                    
                    //standalone flag
                    if(!opt.includes("{") && opt.includes("-")) {
                        standAloneFlags.push(opt);
                    //new flagAndVariable
                    } else if(opt.indexOf("{") != 0 && opt != "") {
                        if(!opt.includes("runtime.ide") && !opt.includes("versionnum") && !opt.includes("build.arch")) {
                            const match = opt.match(/{(.*?)}/);
                            flagAndVariables.push(opt);
                        
                            if(match[1] != null) {
                                variables.push(match[1]);
                            }   
                        }
                    //new variable
                    } else if(opt != "") {
                        //simple variables
                        variables.push(opt.substring(1,opt.length-1));
                    }
                }
            }
        }

        let indexRemove: string[] = [];
        let additionalVariables: string[] = [];
        let fPlusVariablesToRemove: string[] = [];
        

    
        //iterating through boards.txt for key-variable pairs
        map.forEach((value, key) => {
            //ignoring irrelevant entries
            if(key.includes("avrddopti") || !key.includes(platform)) {

            //selecting default value for millistimer
            } else if(key.includes("millistimer")) {
                if(key.includes("tcb2")) {
                    for(let x =0; x < flagAndVariables.length; x++) {
                        if(flagAndVariables[x].includes("millistimer")) {

                            const match = flagAndVariables[x].match(/{(.*?)}/);
    
                            indexRemove.push(match[1]);
                            fPlusVariablesToRemove.push(flagAndVariables[x]);
                            standAloneFlags.push(getFlag(flagAndVariables[x],value));
                        }
                    }
                } 
            }
            //selecting default value for flmapopts
            else if(key.includes("build.flmapopts")) {
                if(key.includes("lockdefault")) {
                    indexRemove.push("build.flmapopts");
                    standAloneFlags.push(value);               
                }    
            //selecting default value ofr attachmode     
            } else if(key.includes("build.attachmode")) {
                if(key.includes("allenabled")) {
                    indexRemove.push("build.attachmode");
                    standAloneFlags.push(value);
                }    
            //selecting default value for wiremode
            } else if(key.includes("build.wiremode")) {
                if(key.includes("mors")) {
                    for(let x =0; x < flagAndVariables.length; x++) {
                        if(flagAndVariables[x].includes("wiremode")) {

                            const match = flagAndVariables[x].match(/{(.*?)}/);
    
                            indexRemove.push(match[1]);
                            fPlusVariablesToRemove.push(flagAndVariables[x]);
                            standAloneFlags.push(getFlag(flagAndVariables[x],value));
                        }
                    }
                }
            //selecting default mode for clocksource
            } else if(key.includes("clocksource")) {
                if(key.includes("24internal") && key.includes("avrdd")) {
                    for(let x =0; x < flagAndVariables.length; x++) {
                        if(flagAndVariables[x].includes("clocksource")) {

                            const match = flagAndVariables[x].match(/{(.*?)}/);
    
                            indexRemove.push(match[1]);
                            fPlusVariablesToRemove.push(flagAndVariables[x]);
                            standAloneFlags.push(getFlag(flagAndVariables[x],value));
                        }
                    }
                } 
            //selecting default value for build.mcu
            } else if(key.includes("build.mcu")) {
                if(key.includes("avr64dd32")) {
                    for(let x =0; x < flagAndVariables.length; x++) {
                        if(flagAndVariables[x].includes("mmcu")) {
                            const match = flagAndVariables[x].match(/{(.*?)}/);


                            indexRemove.push(match[1]);
                            fPlusVariablesToRemove.push(flagAndVariables[x]);
                            standAloneFlags.push(getFlag(flagAndVariables[x],value));
                        }
                    }
                }
            } else {
                //searching for keys that satisfy flagAndVariables
                for(let i = 0; i < flagAndVariables.length; i++) {
                    const match = flagAndVariables[i].match(/{(.*?)}/);

                    if(key.includes(match[1])) {
                        let str = getFlag(flagAndVariables[i],value);

                        if(!str.includes("{") && !str.includes(" ") && !str.includes("}")) {
                            standAloneFlags.push(str);
                        }
                    }
                }

                //searching through for matches to variables
                for(let i = 0; i < variables.length; i++) {
                    if(key.includes(variables[i]) && !key.includes("oldversion")) {
                        //standalone flag(s)
                        if(value.includes("-") && !value.includes("{")) {
                            indexRemove.push(key);
                            standAloneFlags.push(value);
                        //mutliple new variables
                        } else if(value.includes("{") && value.includes(" ")) {
                            let vars = value.split(" ");
                            for(let x = 0; x < vars.length; x++) {
                                additionalVariables.push(vars[x].substring(1,vars[x].length-1))
                            }
                        } 
                    }
                }
            }
        });

        for(let i = 0; i < indexRemove.length; i++) {
            let index = variables.indexOf(indexRemove[i]);
            if(index != -1) {
                variables.splice(index,1);
            } else {
                // console.log("Could not remove " + indexRemove[i]);
            }
        }

        for(let i =0; i < additionalVariables.length; i++) {
            variables.push(additionalVariables[i]);
        }

        for(let i = 0; i < fPlusVariablesToRemove.length; i++) {
            let index = flagAndVariables.indexOf(fPlusVariablesToRemove[i]);
            
            if(index != -1) {
                flagAndVariables.splice(index, 1);
            } else {
                // console.log("Couldn't remove " + flagAndVariables[i]);
            }
        }

        additionalVariables = [];
        indexRemove = [];

        //DEBUG
        // console.log("\n\n");
        // console.log(variables);
        // console.log(standAloneFlags);
        // console.log(flagAndVariables)

        let str = "";

        for(let i = 0; i < standAloneFlags.length; i++) {
            str += standAloneFlags[i] + " ";
        }

        str += hardCodedFlags;

        return str;

    } catch (error) {
        console.error("An error occurred:", error);
    }

    return "";
}

/**
 * Helper function that replaces variable within {} with key-pair value.
 * 
 * @param flagAndVariable e.g. "mmcu={build.version}"
 * @param value value {} should be replaced with e.g. avr64
 * @returns e.g. mmcu=avr64
 */
function getFlag(flagAndVariable: string, value: string): string {
    let leftBracket = flagAndVariable.indexOf("{");
    let rightBracket = flagAndVariable.indexOf("}");

    if(leftBracket == -1 || rightBracket == -1) {
        return "err";
    }

    let flag = flagAndVariable.substring(0,leftBracket) + value;

    if(rightBracket != (flagAndVariable.length - 1)) {
        flag += flagAndVariable.substring(leftBracket+1,flagAndVariable.length-1);
    }

    return flag;
}


