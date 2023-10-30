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
async function getCompileFlags() {
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

export async function hashing(version: string) {
    try {
        //calling boards.txt and platform.txt parser functions
        const localAppData = process.env.LOCALAPPDATA;
        const libraryFilePath = path.join(localAppData, "Arduino15", "packages", "DxCore","hardware","megaavr",version,"boards.txt");
        const map = await parseBoards(libraryFilePath, "avrdd");

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
        let standAloneFlags = [];       //-flag
        let flagAndVariables = [];      //mmcu={variable}, with {}

        //iterating through paltform.txt for variables
        for(let i = 0; i < optionArray.length; i++) {
            let str = optionArray[i];
            //checking for complex variables
            if(str.includes("=") && str.includes("{") {
                flagAndVariables.push(optionArray[i]);
            }
            //filtering for relevant simple variables
            if(str.includes("{") && !str.includes("source_file") && !str.includes("includes") && 
                !str.includes("source_files") && !str.includes("object_file") && !str.includes("core.path")) {
                variables.push(optionArray[i].substring(1,optionArray[i].length-1))
            }
        }

        //DEBUG
        console.log(variables);
        console.log(flagAndVariables);
        // console.log(options);

        //reiterating through platform.txt for variables contained both in recipe and platform.txt
        for(let i = 0; i < array.length; i++) {
            let equalIndex = array[i].indexOf("=");

            let value = array[i].substring(0,equalIndex);
            let options = array[i].substring(equalIndex+1,array[i].length);

            let index = variables.indexOf(value);
            if(index != -1) {
                
                let parsedOptions = options.split(" ");
                
                for(let i = 0; i < parsedOptions.length; i++) {
                    let opt = parsedOptions[i];
                    //flags
                    if(!opt.includes("{") && opt.includes("-")) {
                        standAloneFlags.push(opt);
                    } else if(opt.indexOf("{") != 0 && opt != "") {
                        //copmlex variables
                        const match = opt.match(/{(.*?)}/);
                        flagAndVariables.push(opt);
                        variables.push(match[1]);
                    } else if(opt != "") {
                        //simple variables
                        variables.push(opt.substring(1,opt.length-1));
                    }
                }
            }
        }

        //DEBUG
        console.log("\n\n");
        console.log(variables);
        console.log(standAloneFlags);
        console.log(flagAndVariables)
    
        //iterating through boards.txt for variable values and new variables within platform.txt variables
        map.forEach((value, key) => {
            let splitIndex = -1;
            for(let i = 0; i < variables.length; i++) {
                if(key.includes("build.flmapopts")) {

                } else if(key.includes("build.attachmode")) {

                } else if(key.includes("wiremode")) {

                } else if(key.includes("millistimer")) {

                } else if(key.includes("clocksource")) {

                } else if(key.includes(variables[i]) && !key.includes("oldversion")) {
                    // console.log(key + ":   " + value);
                    if(!value.includes(" ")) {
                        if()
                         
                    } else if(value.includes("{")) {

                    }
                }
                
            }

            //TODO: add variable values to flags[] and remove simple variables from array
            //TODO: replace variables names in complex variables with their values and add to flag array
        });

        //TODO: reiterate through map for newly found variable values
    } catch (error) {
        console.error("An error occurred:", error);
    }
}



