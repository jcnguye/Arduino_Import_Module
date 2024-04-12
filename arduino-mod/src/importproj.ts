import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';


export function copyDirectory(src: string, dest: string): void {
	// Create destination directory if it doesn't exist
	if (!fs.existsSync(dest)) {
		fs.mkdirSync(dest);
	}
	
	  // Read the source directory
	const files = fs.readdirSync(src);
	
	// Copy each file to the destination directory
	files.forEach(file => {
		const srcPath = path.join(src, file);
		const destPath = path.join(dest, file);
		if (fs.lstatSync(srcPath).isDirectory()) {
		  // Recursively copy subdirectories
		  copyDirectory(srcPath, destPath);
		} else {
		  // Copy files
		  fs.copyFileSync(srcPath, destPath);
		}
	});
}


/** Recursively copies each directory to each specified location
 * 
 * @param src[..][0] The source directory
 * @param src[..][1] The destination directory
 * @param basePath The path to apply before the destination directory
 */
export function copyDirectoriesPaired(pairs: [string, string][], basePath: string): void {
	// Create destination directory if it doesn't exist

	// Read the source directory
	for (const src of pairs) {
		const truePath = path.join(basePath, src[1]);
		if (!fs.existsSync(truePath)) {
			fs.mkdirSync(truePath);
		}
		copyDirectory(src[0], truePath);
	}
}
