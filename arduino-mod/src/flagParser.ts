import * as vscode from 'vscode';
import * as readline from 'readline';
import * as fs from 'fs';
import * as path from 'path';

export function obtainFlags(recipeName: string, boardOptionsAndName: string[], platformPath: string, boardPath: string): string {

    let recipeTemplate = obtainRecipeTemplate(recipeName, platformPath);
	const flagMap = obtainFlagMap(platformPath, boardPath, boardOptionsAndName);
	const flags = interpretRecipe(recipeTemplate, flagMap);

	console.log("Final recipe: " + flags);

    return flags;
}

function obtainRecipeTemplate(recipeName: string, platformPath:string): string {
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

function obtainFlagMap(platformPath: string, boardPath: string, boardOptionsAndName: string[]): Map<string, string>{
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
			if (line.includes('=')) {
				const [key, value] = line.split('=');
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
			if (line.includes('=')) {
				boardOptionsAndName.forEach(opt => {
					if (line.startsWith(opt)) {
						const substring = line.replace(opt, ''); //remove the board or option from the beginning of they key 
						const [key, value] = substring.split('=');
        				flagMap.set(key, value);
					}
				});
			}
		});
	}

	return flagMap;
}

function interpretRecipe(recipeTemplate: string, flagMap: Map<string, string>): string {
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
