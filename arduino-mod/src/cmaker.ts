import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';


/*
 * This function makes a basic cmake file skeleton.
 * 
 */
export function cmakeSkeleton(projDir: string, projName: string) {
	let cmakeHeader = "cmake_minimum_required(VERSION 3.0)"
	cmakeHeader = cmakeHeader + '\nset(CMAKE_C_COMPILER "${CMAKE_CURRENT_SOURCE_DIR}/core/compiler/bin/avr-gcc")'
	cmakeHeader = cmakeHeader + '\nset(CMAKE_CXX_COMPILER "${CMAKE_CURRENT_SOURCE_DIR}/core/compiler/bin/avr-gcc")'
	cmakeHeader = cmakeHeader + "\nproject(" + projName + ")"
	fs.writeFileSync(projDir + "/CMakeLists.txt", cmakeHeader);
	// use fs.appendFileSync(projDir + "/CMakeLists.txt", data); for future appends
}

export function addSourceFile(projDir: string, projName: string, srcName: string) {
	let cmakeSrc = "\nadd_executable(" + projName + " " + srcName +")"
	fs.appendFileSync(projDir + "/CMakeLists.txt", cmakeSrc);
}