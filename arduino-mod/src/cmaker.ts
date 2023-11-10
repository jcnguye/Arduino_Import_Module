import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

/*
 * This function deletes all cmake-related files in the project directory.
 */
export function resetCmakeFiles(projDir: string) {
	if (fs.existsSync(projDir + "/CMakeLists.txt")) {
		fs.unlinkSync(projDir + "/CMakeLists.txt")
	}
	if (fs.existsSync(projDir + "/Makefile")) {
		fs.unlinkSync(projDir + "/Makefile")
	}
	if (fs.existsSync(projDir + "/cmake_install.cmake")) {
		fs.unlinkSync(projDir + "/cmake_install.cmake")
	}
	if (fs.existsSync(projDir + "/CMakeCache.txt")) {
		fs.unlinkSync(projDir + "/CMakeCache.txt")
	}
	if (fs.existsSync(projDir + "/CMakeFiles")) {
		fs.rmSync(projDir + "/CMakeFiles", { recursive: true, force: true })
	}
}


/*
 * This function makes a basic cmake file skeleton.
 * 
 */
export function cmakeSkeleton(projDir: string, projName: string) {
	let cmakeHeader = "cmake_minimum_required(VERSION 3.0)"
	cmakeHeader = cmakeHeader + '\nset(CMAKE_C_COMPILER "${CMAKE_CURRENT_SOURCE_DIR}/core/compiler/bin/avr-gcc")'
	cmakeHeader = cmakeHeader + '\nset(CMAKE_CXX_COMPILER "${CMAKE_CURRENT_SOURCE_DIR}/core/compiler/bin/avr-g++")'
	cmakeHeader = cmakeHeader + "\nproject(" + projName + ")"
	fs.writeFileSync(projDir + "/CMakeLists.txt", cmakeHeader);
	// use fs.appendFileSync(projDir + "/CMakeLists.txt", data); for future appends
}

export function addSourceFile(projDir: string, projName: string, srcName: string) {
	let cmakeSrc = "\nadd_executable(" + projName + " " + srcName +")"
	fs.appendFileSync(projDir + "/CMakeLists.txt", cmakeSrc);
}

export function addCompilerFlags(projDir: string, projName: string, flags: string) {
	let cmakeSrc = "\ntarget_compile_options(" + projName + " PRIVATE " + flags +")"
	fs.appendFileSync(projDir + "/CMakeLists.txt", cmakeSrc);
}

export function addLinkerFlags(projDir: string, projName: string, flags: string) {
	let cmakeSrc = "\ntarget_link_libraries(" + projName + " " + flags +")"
	fs.appendFileSync(projDir + "/CMakeLists.txt", cmakeSrc);
}

// if this is the same command for all boards, then this should be un-exported and called internally after addLinkerFlags
export function addHexBuilder(projDir: string, projName: string) {
	let hex = "add_custom_command(TARGET " + projName + " POST_BUILD COMMAND ${CMAKE_CURRENT_SOURCE_DIR}/core/compiler/bin/avr-objcopy -O ihex -R .eeprom " + projName + " " + projName + ".hex)"
	fs.appendFileSync(projDir + "/CMakeLists.txt", hex);
}


/*

Listing out the order cmake needs to run things in:

 - (other stuff)
 Archiver:
 - Archive all libraries to the core.a file
 Linker:
 - create .elf file, linking to core.a (already happens during the linker command)
 - create bin
 - create eeprom
 - lst
 - map
*/
