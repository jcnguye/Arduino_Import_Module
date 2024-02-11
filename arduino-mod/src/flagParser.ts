import * as vscode from 'vscode';
import * as readline from 'readline';
import * as fs from 'fs';
import * as path from 'path';

export function obtainFlags(recipeName: string, platformPath: string, boardPath: string, boardName: string): string {
    let result = '';

    let recipeTemplate = obtainRecipeTemplate(recipeName, platformPath);
	const flagMap = obtainFlagMap(platformPath, boardPath, boardName);



    return result;
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

function obtainFlagMap(platformPath: string, boardPath: string, boardName: string){
	const flagMap = new Map();
	let data = '';
	try {
		data = fs.readFileSync(platformPath, 'utf8');
	} catch (err) {
		console.error('Error reading file:', err);
	}

	if (data) {
		const lines = data.split('\n');
		lines.forEach(line => {
			if (line.includes('=')) {
				const [key, value] = line.split('=');
        		flagMap.set(key, value);
			}
		});
	}

	//TODO - handle boards.txt 
	console.log(flagMap);

	return flagMap;
}
