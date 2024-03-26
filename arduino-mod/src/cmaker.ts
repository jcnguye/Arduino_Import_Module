import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { Board } from './board';
import {CMAKE} from './constants';

export class Cmaker {
	public projDir: string;
	public projName: string;
	public srcFileName: string;
	public compilerflags: string;
	private board: Board;
	private debuggingOptimization: boolean; 
	private includeUtilitiesDir: boolean = false; 
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
	public setIncludeUtilitiesDir(includeUtilitiesDir:boolean){
		this.includeUtilitiesDir = includeUtilitiesDir;
	}
	
	public resetCmake(): void {
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
	}

	public build(): void{
		// reset all cmake files before creating the new file
		this.resetCmake();
		
		//sets the cmake version
		let cmakeHeader = CMAKE.VERSION;
		
		const binPath = path.join(this.board.getPathToCompiler(), "bin");
		cmakeHeader = cmakeHeader + CMAKE.SET_C_COMPILER + path.join(binPath, CMAKE.C_COMPILER).replace(/\\/g, '/') + ')\n';
		cmakeHeader = cmakeHeader + CMAKE.SET_CXX_COMPILER + path.join(binPath, CMAKE.CXX_COMPILER).replace(/\\/g, '/') +')\n';
		cmakeHeader = cmakeHeader + CMAKE.SET_SYSTEM;

		cmakeHeader = cmakeHeader + 'project(' + this.projName + ' C CXX)\n\n';

		cmakeHeader = cmakeHeader + CMAKE.SET_CORE_DIR;
		cmakeHeader = cmakeHeader + CMAKE.SET_LIB_DIR;
		
		cmakeHeader = cmakeHeader + CMAKE.SET_AR + path.join(binPath, CMAKE.AVR).replace(/\\/g, '/') +')\n';
		cmakeHeader = cmakeHeader + CMAKE.SET_OBJ_COPY + path.join(binPath, CMAKE.OBJ_COPY).replace(/\\/g, '/') +')\n\n';
		cmakeHeader = cmakeHeader + CMAKE.SET_OBJ_DUMP + path.join(binPath, CMAKE.OBJ_DUMP).replace(/\\/g, '/') +')\n\n';

		let cFlags = this.board.getCFlags();
		let cxxFlags = this.board.getCXXFlags();

		if(this.debuggingOptimization) {
			cxxFlags = cxxFlags.replace(this.codeSizeOptimizeFlag, this.debugOptimizeFlag);
			cFlags = cFlags.replace(this.codeSizeOptimizeFlag, this.debugOptimizeFlag);
		}
		cmakeHeader = cmakeHeader +  CMAKE.SET_CXX_FLAGS + cxxFlags + '")\n';
		cmakeHeader = cmakeHeader + CMAKE.SET_C_FLAGS + cFlags + '")\n';

		cmakeHeader = cmakeHeader + CMAKE.SET_STATIC_LIBRARY_FLAGS
		cmakeHeader = cmakeHeader + CMAKE.SET_C_LINKER_FLAGS + this.board.getCFlagsLinker() +  '${CMAKE_CURRENT_SOURCE_DIR}/build/CMakeFiles/' + this.projName + '.dir/' + this.projName + 
		'.elf ${CMAKE_CURRENT_SOURCE_DIR}/build/CMakeFiles/' + this.projName + '.dir/' + this.projName + '.cpp.o ${CMAKE_CURRENT_SOURCE_DIR}/build/libcore.a -L${CMAKE_CURRENT_SOURCE_DIR}/build -lm")\n\n';

		// map file generator
		cmakeHeader = cmakeHeader + 'set(CMAKE_EXE_LINKER_FLAGS "${CMAKE_EXE_LINKER_FLAGS} -Wl,-Map=${CMAKE_BINARY_DIR}/output/'+ this.projName +'.map")\n';

		//cmake  adding executable 
		let cmakeSrcExecutable = "add_executable(" + this.projName + '.elf ' + this.srcFileName +")\n";
		cmakeSrcExecutable = cmakeSrcExecutable + 'set_target_properties(' + this.projName + '.elf PROPERTIES RUNTIME_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/output)\n';
		
		let cmakeDir = "";

		if(this.board.boardName === "Nano") {
			cmakeDir = CMAKE.NANO_INCLUDE;
		} else if(this.board.boardName === "DxCore") {
			cmakeDir = CMAKE.DXCORE_INCLUDE;
		} else {
			console.error("Board type not defined");
		}
		
		
		cmakeDir = cmakeDir + 'file(GLOB CORE_SOURCES "${CORE_DIR}/*.cpp" "${CORE_DIR}/*.c")\n';
		cmakeDir = cmakeDir + 'file(GLOB LIB_SOURCES "${LIB_DIR}/*.cpp" "${LIB_DIR}/*.c")\n';

		if (this.includeUtilitiesDir) {
			cmakeDir = cmakeDir + 'set(UTIL_DIR ${CMAKE_CURRENT_SOURCE_DIR}/core/utility)\n';
			cmakeDir = cmakeDir + 'file(GLOB UTIL_SOURCES "${UTIL_DIR}/*.cpp" "${UTIL_DIR}/*.c")\n';
			cmakeDir = cmakeDir + 'add_library(core STATIC ${CORE_SOURCES} ${LIB_SOURCES} ${UTIL_SOURCES})\n'; 
		} else {
			cmakeDir = cmakeDir + 'add_library(core STATIC ${CORE_SOURCES} ${LIB_SOURCES})\n'; 
		}	
		cmakeDir = cmakeDir + 'target_link_libraries(' +  this.projName + '.elf PRIVATE core)\n\n';
		
		// hex file generator
		let hex = 'set(HEX_FILE_OUTPUT_PATH "${CMAKE_CURRENT_BINARY_DIR}/output/' + this.projName + '.hex")\n';
		hex = hex + 'add_custom_command(TARGET ' + this.projName + '.elf POST_BUILD COMMAND ${CMAKE_OBJCOPY} -O ihex $<TARGET_FILE:' + this.projName + '.elf> ${HEX_FILE_OUTPUT_PATH} COMMENT "Generating HEX file")\n';
		hex = hex + '\n\nadd_custom_target(GenerateHex ALL DEPENDS ${HEX_FILE_OUTPUT_PATH} COMMENT "Building HEX file")\n';

		// set .elf and .map to go to output folder
		let elf = CMAKE.ELF_DIR + this.projName + '.elf")\n';
		let map = CMAKE.MAP_DIR + this.projName + '.map")\n';
		
		
		// generate lst file
		let lst = CMAKE.LST_DIR+ this.projName + '.lst")\n';
		lst = lst + 'add_custom_command(TARGET ' + this.projName + '.elf POST_BUILD COMMAND ${CMAKE_OBJDUMP} --disassemble --source --line-numbers --demangle --section=.text $<TARGET_FILE:' + this.projName + '.elf> > ${LST_FILE_OUTPUT_PATH} COMMENT "Generating LST file")\n';
		lst = lst + 'add_custom_target(GenerateLst ALL DEPENDS ${LST_FILE_OUTPUT_PATH} COMMENT "Building LST file")\n';
		
		
		
		// write final output
		let output = cmakeHeader + cmakeSrcExecutable + cmakeDir + hex + elf + map + lst;
		if(process.platform !== "win32") {
			output = output.replace(/\.exe/g, "");
		}
		fs.writeFileSync(this.projDir + CMAKE.FILE_NAME, output);

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
