import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { Board } from './board';

export class Cmaker {
	public projDir: string;
	public projName: string;
	public srcFileName: string;
	public compilerflags: string;
	private board: Board;
	private debuggingOptimization: boolean; 

	//CONSTANTS
	private debugOptimizeFlag: string = "-Og -g2";
	private codeSizeOptimizeFlag: string = "-Os";
	
	constructor(board: Board, debuggingOptimization: boolean){
		this.projDir = "";
		this.projName = "";
		this.srcFileName = "";
		this.compilerflags = "";
		this.board = board; 
		this.debuggingOptimization = debuggingOptimization;
	}
	public setProjectDirectory(projectDirectory:string){
		this.projDir = projectDirectory;
	}
	public setProjectName(projectName:string){
		this.projName = projectName;
	}
	public setSourceName(sourceFileName:string){
		this.srcFileName = sourceFileName;
	}
	public setCompilerFlags(compileFlag:string){
		this.compilerflags = compileFlag;
	}


	public build(): void{

		//sets the cmake version
		let cmakeHeader = "cmake_minimum_required(VERSION 3.28)\n";
		
		const binPath = path.join(this.board.getPathToCompiler(), "bin");
		cmakeHeader = cmakeHeader + 'set(CMAKE_C_COMPILER ' + path.join(binPath, "avr-gcc.exe").replace(/\\/g, '/') + ')\n';
		cmakeHeader = cmakeHeader + 'set(CMAKE_CXX_COMPILER ' + path.join(binPath, "avr-g++.exe").replace(/\\/g, '/') +')\n';
		cmakeHeader = cmakeHeader + 'set(CMAKE_SYSTEM_NAME Generic)\n\n';

		cmakeHeader = cmakeHeader + 'project(' + this.projName + ' C CXX)\n\n';

		cmakeHeader = cmakeHeader + 'set(CORE_DIR ${CMAKE_CURRENT_SOURCE_DIR}/core)\n\n';
		
		cmakeHeader = cmakeHeader + 'set(CMAKE_AR ' + path.join(binPath, "avr-gcc-ar.exe").replace(/\\/g, '/') +')\n';
		cmakeHeader = cmakeHeader + 'set(CMAKE_OBJCOPY ' + path.join(binPath, "avr-objcopy.exe").replace(/\\/g, '/') +')\n\n';

		let cxxFlags = this.board.getCXXFlags();
		let cFlags = this.board.getCFlags();
		if(this.debuggingOptimization) {
			cxxFlags = cxxFlags.replace(this.codeSizeOptimizeFlag, this.debugOptimizeFlag);
			cFlags = cFlags.replace(this.codeSizeOptimizeFlag, this.debugOptimizeFlag);
		}
		cmakeHeader = cmakeHeader + 'set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} ' + cxxFlags + '")\n';
		cmakeHeader = cmakeHeader + 'set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} ' + cFlags + '")\n';

		cmakeHeader = cmakeHeader + 'set(CMAKE_STATIC_LIBRARY_FLAGS "rcs")\n';
		cmakeHeader = cmakeHeader + 'set(CMAKE_C_FLAGS_LINKER "${CMAKE_C_FLAGS_LINKER} ' + this.board.getCFlagsLinker() +  ' -o ${CMAKE_CURRENT_SOURCE_DIR}/build/CMakeFiles/' + this.projName + '.dir/' + this.projName + 
		'.elf ${CMAKE_CURRENT_SOURCE_DIR}/build/CMakeFiles/' + this.projName + '.dir/' + this.projName + '.cpp.o ${CMAKE_CURRENT_SOURCE_DIR}/build/libcore.a -L${CMAKE_CURRENT_SOURCE_DIR}/build -lm")\n\n';

		//cmake  adding executable 
		let cmakeSrcExecutable = "add_executable(" + this.projName + " " + this.srcFileName +")\n";
		
		let cmakeDir = 'include_directories("${CMAKE_CURRENT_SOURCE_DIR}/core" "${CMAKE_CURRENT_SOURCE_DIR}/core/eightanaloginputs" "${CMAKE_CURRENT_SOURCE_DIR}/core/standard")\n' +
		'file(GLOB CORE_SOURCES "${CORE_DIR}/*.cpp" "${CORE_DIR}/*.c")\nadd_library(core STATIC ${CORE_SOURCES})\ntarget_link_libraries(' +  this.projName + ' PRIVATE core)\n\n';
		
		// hex file generator
		let hex = 'set(HEX_FILE_OUTPUT_PATH "${CMAKE_CURRENT_BINARY_DIR}/output/' + this.projName + '.hex")\n';
		hex = hex + 'add_custom_command(TARGET ' + this.projName + ' POST_BUILD COMMAND ${CMAKE_OBJCOPY} -O ihex $<TARGET_FILE:' + this.projName + '> ${HEX_FILE_OUTPUT_PATH} COMMENT "Generating HEX file")\n';
		hex = hex + '\n\nadd_custom_target(GenerateHex ALL DEPENDS ${HEX_FILE_OUTPUT_PATH} COMMENT "Building HEX file")\n';

		// set .elf, .map, and .lss files to output folder when these are eventually created
		let elf = 'set(ELF_FILE_OUTPUT_PATH "${HEX_FILE_OUTPUT_PATH}/' + this.projName + '.elf")\n';
		let map = 'set(MAP_FILE_OUTPUT_PATH "${HEX_FILE_OUTPUT_PATH}/' + this.projName + '.map")\n';
		let lss = 'set(LSS_FILE_OUTPUT_PATH "${HEX_FILE_OUTPUT_PATH}/' + this.projName + '.lss")\n';

		//resets Cmake File
		if (fs.existsSync(this.projDir + "/CMakeLists.txt")) {
			fs.unlinkSync(this.projDir + "/CMakeLists.txt");
		}
		if (fs.existsSync(this.projDir + "/Makefile")) {
			fs.unlinkSync(this.projDir + "/Makefile");
		}
		if (fs.existsSync(this.projDir + "/cmake_install.cmake")) {
			fs.unlinkSync(this.projDir + "/cmake_install.cmake");
		}
		if (fs.existsSync(this.projDir + "/CMakeCache.txt")) {
			fs.unlinkSync(this.projDir + "/CMakeCache.txt");
		}
		if (fs.existsSync(this.projDir + "/CMakeFiles")) {
			fs.rmSync(this.projDir + "/CMakeFiles", { recursive: true, force: true });
		}

		fs.writeFileSync(this.projDir + "/CMakeLists.txt", cmakeHeader);
		fs.appendFileSync(this.projDir + "/CMakeLists.txt", cmakeSrcExecutable);
		fs.appendFileSync(this.projDir + "/CMakeLists.txt", cmakeDir);
		fs.appendFileSync(this.projDir + "/CMakeLists.txt", hex);
		fs.appendFileSync(this.projDir + "/CMakeLists.txt", elf);
		fs.appendFileSync(this.projDir + "/CMakeLists.txt", map);
		fs.appendFileSync(this.projDir + "/CMakeLists.txt", lss);

		// use fs.appendFileSync(projDir + "/CMakeLists.txt", data); for future appends

	}
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
 - create hex (addHexBuilder)
 - lst
 - map
*/


export default Cmaker;
