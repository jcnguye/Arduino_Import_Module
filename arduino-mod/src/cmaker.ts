import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { Board } from './board';

export class Cmaker {
	public projDir: string;
	public projName: string;
	public srcFileName: string;
	public compilerflags: string;
	public linkerflags: string;
	private board: Board;
	
	constructor(board: Board){
		this.projDir = "";
		this.projName = "";
		this.srcFileName = "";
		this.compilerflags = "";
		this.linkerflags = "";
		this.board = board; 
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
	public setLinkerFlags(linkerFlags:string){
		this.linkerflags = linkerFlags;
	}


	public build(): void{

		//sets the cmake version
		let cmakeHeader = "cmake_minimum_required(VERSION 3.8)\n";
		
		const binPath = path.join(this.board.getPathToCompiler(), "bin");
		cmakeHeader = cmakeHeader + 'set(CMAKE_C_COMPILER ' + path.join(binPath, "avr-gcc.exe").replace(/\\/g, '/') + ')\n';
		cmakeHeader = cmakeHeader + 'set(CMAKE_CXX_COMPILER ' + path.join(binPath, "avr-g++.exe").replace(/\\/g, '/') +')\n';

		cmakeHeader = cmakeHeader + 'project(' + this.projName + ' C CXX)\n\n';
		cmakeHeader = cmakeHeader + 'set(CORE_DIR ${CMAKE_CURRENT_SOURCE_DIR}/core)\n\n';
		
		cmakeHeader = cmakeHeader + 'set(CMAKE_AR ' + path.join(binPath, "avr-gcc-ar.exe").replace(/\\/g, '/') +')\n';
		cmakeHeader = cmakeHeader + 'set(CMAKE_OBJCOPY ' + path.join(binPath, "avr-objcopy.exe").replace(/\\/g, '/') +')\n\n';

		cmakeHeader = cmakeHeader + 'set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -c -g -Os -w -std=gnu++11 -fpermissive -fno-exceptions ' + 
		'-ffunction-sections -fdata-sections -fno-threadsafe-statics -Wno-error=narrowing -MMD -flto -mmcu=atmega328p -DF_CPU=16000000L '+ 
		'-DARDUINO=10607 -DARDUINO_AVR_NANO -DARDUINO_ARCH_AVR")\n';
		cmakeHeader = cmakeHeader + 'set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} -c -g -Os -w -std=gnu11 -ffunction-sections -fdata-sections -MMD ' + 
		'-flto -fno-fat-lto-objects -mmcu=atmega328p -DF_CPU=16000000L -DARDUINO=10607 -DARDUINO_AVR_NANO -DARDUINO_ARCH_AVR")\n';
		cmakeHeader = cmakeHeader + 'set(CMAKE_STATIC_LIBRARY_FLAGS "rcs")\n';
		cmakeHeader = cmakeHeader + 'set(CMAKE_C_FLAGS_LINKER "${CMAKE_C_FLAGS_LINKER} -w -Os -g -flto -fuse-linker-plugin -Wl,--gc-sections ' +
		'-mmcu=atmega328p -o ${CMAKE_CURRENT_SOURCE_DIR}/build/CMakeFiles/' + this.projName + '.dir/' + this.projName + 
		'.elf ${CMAKE_CURRENT_SOURCE_DIR}/build/CMakeFiles/' + this.projName + '.dir/' + this.projName + '.cpp.o ${CMAKE_CURRENT_SOURCE_DIR}/build/libcore.a -L${CMAKE_CURRENT_SOURCE_DIR}/build -lm")\n\n';

		//cmake  adding executable 
		let cmakeSrcExecutable = "add_executable(" + this.projName + " " + this.srcFileName +")\n";
		// cmake adding compile option
		let cmakeSrcCompileOpt = "target_compile_options(" + this.projName + " PRIVATE " + this.compilerflags +")\n";
		// cmake link libary
		let cmakeSrcLinkLib = "target_link_libraries(" + this.projName + " " + this.linkerflags +")\n";
		// cmake include directories, file, and add library
		let cmakeDir = 'include_directories("${CMAKE_CURRENT_SOURCE_DIR}/core" "${CMAKE_CURRENT_SOURCE_DIR}/core/eightanaloginputs" "${CMAKE_CURRENT_SOURCE_DIR}/core/standard")\n' +
		'file(GLOB CORE_SOURCES "${CORE_DIR}/*.cpp" "${CORE_DIR}/*.c")\nadd_library(core STATIC ${CORE_SOURCES})\n\n';
		// hex file generator
		let hex = "add_custom_command(TARGET " + this.projName + " POST_BUILD COMMAND ${CMAKE_CURRENT_SOURCE_DIR}/core/compiler/bin/avr-objcopy -O ihex -R .eeprom " + this.projName + " " + this.projName + ".hex)\n";
		hex = hex + 'set(HEX_FILE_OUTPUT_PATH "${CMAKE_CURRENT_BINARY_DIR}/' + this.projName + '/output/hex_file.hex")\n';
		// bin file generator
		let bin = "add_custom_command(TARGET " + this.projName + " POST_BUILD COMMAND ${CMAKE_CURRENT_SOURCE_DIR}/core/compiler/bin/avr-objcopy -O binary -R .eeprom " + this.projName + " " + this.projName + ".bin)\n";
		// set .elf, .map, and .lss files to output folder when these are eventually created
		let elf = 'set(ELF_FILE_OUTPUT_PATH "${CMAKE_CURRENT_BINARY_DIR}/' + this.projName + '/output/elf_file.elf")\n';
		let map = 'set(MAP_FILE_OUTPUT_PATH "${CMAKE_CURRENT_BINARY_DIR}/' + this.projName + '/output/map_file.map")\n';
		let lss = 'set(LSS_FILE_OUTPUT_PATH "${CMAKE_CURRENT_BINARY_DIR}/' + this.projName + '/output/lss_file.lss")\n';

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
		fs.appendFileSync(this.projDir + "/CMakeLists.txt", cmakeSrcCompileOpt);
		fs.appendFileSync(this.projDir + "/CMakeLists.txt", cmakeSrcLinkLib);
		fs.appendFileSync(this.projDir + "/CMakeLists.txt", cmakeDir);
		fs.appendFileSync(this.projDir + "/CMakeLists.txt", hex);
		fs.appendFileSync(this.projDir + "/CMakeLists.txt", bin);
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
