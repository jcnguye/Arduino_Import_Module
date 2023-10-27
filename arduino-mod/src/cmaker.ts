import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';


/*
 * This function makes a basic cmake file skeleton.
 * 
 */
export function cmakeSkeleton(projDir: string, projName: string) {
	let data = "cmake_minimum_required(VERSION 3.0)"
	data = data + '\nset(CMAKE_C_COMPILER "${CMAKE_CURRENT_SOURCE_DIR}/core/compiler/bin/avr-gcc")'
	data = data + '\nset(CMAKE_CXX_COMPILER "${CMAKE_CURRENT_SOURCE_DIR}/core/compiler/bin/avr-gcc")'
	data = data + "\nproject(" + projName + ")"
	console.log("now write to the file?")
	fs.writeFileSync(projDir + "/CMakeLists.txt", data);
	// use fs.appendFileSync(projDir + "/CMakeLists.txt", data); for future appends
}
