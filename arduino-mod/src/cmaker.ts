import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { Board } from './board';
import { Recipe } from './recipeBuilder';

export class Cmaker {
	public projDir: string;
	public projName: string;
	public srcFileName: string;
	public compilerflags: string;
	private board: Board;
	private debuggingOptimization: boolean; 
	private recipe: Recipe;
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
		this.recipe = new Recipe(board);
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
		let cmakeHeader = "cmake_minimum_required(VERSION 3.28)\n";
		
		const binPath = path.join(this.board.getPathToCompiler(), "bin");
		cmakeHeader = cmakeHeader + 'set(CMAKE_C_COMPILER ' + path.join(binPath, "avr-gcc.exe").replace(/\\/g, '/') + ')\n';
		cmakeHeader = cmakeHeader + 'set(CMAKE_CXX_COMPILER ' + path.join(binPath, "avr-g++.exe").replace(/\\/g, '/') +')\n';
		cmakeHeader = cmakeHeader + 'set(CMAKE_SYSTEM_NAME Generic)\n\n';

		cmakeHeader = cmakeHeader + 'project(' + this.projName + ' C CXX)\n\n';

		cmakeHeader = cmakeHeader + 'set(CORE_DIR ${CMAKE_CURRENT_SOURCE_DIR}/core)\n\n';
		
		cmakeHeader = cmakeHeader + 'set(CMAKE_AR ' + path.join(binPath, "avr-gcc-ar.exe").replace(/\\/g, '/') +')\n';
		cmakeHeader = cmakeHeader + 'set(CMAKE_OBJCOPY ' + path.join(binPath, "avr-objcopy.exe").replace(/\\/g, '/') +')\n\n';
		cmakeHeader = cmakeHeader + 'set(CMAKE_OBJDUMP ' + path.join(binPath, "avr-objdump.exe").replace(/\\/g, '/') +')\n\n';

		let recipeString = this.board.getPlatformCCompilerRecipePattern();
		let finalFormatRecipe = this.recipe.formatCCompilerBuild(recipeString);
		
		this.board.setCFlags(finalFormatRecipe);
		let cFlags = this.board.getCFlags();
		let cxxFlags = this.board.getCXXFlags();

		if(this.debuggingOptimization) {
			cxxFlags = cxxFlags.replace(this.codeSizeOptimizeFlag, this.debugOptimizeFlag);
			cFlags = cFlags.replace(this.codeSizeOptimizeFlag, this.debugOptimizeFlag);
		}
		cmakeHeader = cmakeHeader + 'set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} ' + cxxFlags + '")\n';
		cmakeHeader = cmakeHeader + 'set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} ' + cFlags + '")\n';

		cmakeHeader = cmakeHeader + 'set(CMAKE_STATIC_LIBRARY_FLAGS "rcs")\n';
		cmakeHeader = cmakeHeader + 'set(CMAKE_C_FLAGS_LINKER "${CMAKE_C_FLAGS_LINKER} ' + this.board.getCFlagsLinker() +  '${CMAKE_CURRENT_SOURCE_DIR}/build/CMakeFiles/' + this.projName + '.dir/' + this.projName + 
		'.elf ${CMAKE_CURRENT_SOURCE_DIR}/build/CMakeFiles/' + this.projName + '.dir/' + this.projName + '.cpp.o ${CMAKE_CURRENT_SOURCE_DIR}/build/libcore.a -L${CMAKE_CURRENT_SOURCE_DIR}/build -lm")\n\n';

		// map file generator
		cmakeHeader = cmakeHeader + 'set(CMAKE_EXE_LINKER_FLAGS "${CMAKE_EXE_LINKER_FLAGS} -Wl,-Map=${CMAKE_BINARY_DIR}/output/'+ this.projName +'.map")';

		//cmake  adding executable 
		let cmakeSrcExecutable = "add_executable(" + this.projName + '.elf ' + this.srcFileName +")\n";
		cmakeSrcExecutable = cmakeSrcExecutable + 'set_target_properties(' + this.projName + '.elf PROPERTIES RUNTIME_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/output)\n';
		
		let cmakeDir = 'include_directories("${CMAKE_CURRENT_SOURCE_DIR}/core" "${CMAKE_CURRENT_SOURCE_DIR}/core/eightanaloginputs" "${CMAKE_CURRENT_SOURCE_DIR}/core/standard")\n' +
		'file(GLOB CORE_SOURCES "${CORE_DIR}/*.cpp" "${CORE_DIR}/*.c")\nadd_library(core STATIC ${CORE_SOURCES})\ntarget_link_libraries(' +  this.projName + '.elf PRIVATE core)\n\n';
		
		// hex file generator
		let hex = 'set(HEX_FILE_OUTPUT_PATH "${CMAKE_CURRENT_BINARY_DIR}/output/' + this.projName + '.hex")\n';
		hex = hex + 'add_custom_command(TARGET ' + this.projName + '.elf POST_BUILD COMMAND ${CMAKE_OBJCOPY} -O ihex $<TARGET_FILE:' + this.projName + '.elf> ${HEX_FILE_OUTPUT_PATH} COMMENT "Generating HEX file")\n';
		hex = hex + '\n\nadd_custom_target(GenerateHex ALL DEPENDS ${HEX_FILE_OUTPUT_PATH} COMMENT "Building HEX file")\n';

		// set .elf and .map to go to output folder
		let elf = 'set(ELF_FILE_OUTPUT_PATH "${CMAKE_CURRENT_BINARY_DIR}/output/' + this.projName + '.elf")\n';
		let map = 'set(MAP_FILE_OUTPUT_PATH "${CMAKE_CURRENT_BINARY_DIR}/output/' + this.projName + '.map")\n';
		
		
		// generate lst file
		let lst = 'set(LST_FILE_OUTPUT_PATH "${CMAKE_CURRENT_BINARY_DIR}/output/' + this.projName + '.lst")\n';
		lst = lst + 'add_custom_command(TARGET ' + this.projName + '.elf POST_BUILD COMMAND ${CMAKE_OBJDUMP} --disassemble --source --line-numbers --demangle --section=.text $<TARGET_FILE:' + this.projName + '.elf> > ${LST_FILE_OUTPUT_PATH} COMMENT "Generating LST file")\n';
		lst = lst + 'add_custom_target(GenerateLst ALL DEPENDS ${LST_FILE_OUTPUT_PATH} COMMENT "Building LST file")\n';
		
		
		
		// write final output
		let output = cmakeHeader + cmakeSrcExecutable + cmakeDir + hex + elf + map + lst;
		if(process.platform !== "win32") {
			output = output.replace(/\.exe/g, "");
		}
		fs.writeFileSync(this.projDir + "/CMakeLists.txt", output);

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
