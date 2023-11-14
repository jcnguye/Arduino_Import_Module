import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export class Cmaker {
	public projDir: string;
	public projName: string;
	public srcFileName: string;
	public compilerflags: string;
	public linkerflags: string;
	
	constructor(){
		this.projDir = "";
		this.projName = "";
		this.srcFileName = "";
		this.compilerflags = "";
		this.linkerflags = "";
	}
	public setProjectDirectory(ProjectDirectory:string){
		this.projDir = ProjectDirectory;
	}
	public setProjectName(ProjectName:string){
		this.projName = ProjectName;
	}
	public setSourceName(SourceFileName:string){
		this.srcFileName = SourceFileName;
	}
	public setCompilerFlags(CompileFlag:string){
		this.compilerflags = CompileFlag;
	}
	public setLinkerFlags(linkerFlags:string){
		this.linkerflags = linkerFlags;
	}


	public build(): void{

		//sets the cmake version
		let cmakeHeader = "cmake_minimum_required(VERSION 3.0)"
		cmakeHeader = cmakeHeader + '\nset(CMAKE_C_COMPILER "${CMAKE_CURRENT_SOURCE_DIR}/core/compiler/bin/avr-gcc")'
		cmakeHeader = cmakeHeader + '\nset(CMAKE_CXX_COMPILER "${CMAKE_CURRENT_SOURCE_DIR}/core/compiler/bin/avr-g++")'
		cmakeHeader = cmakeHeader + "\nproject(" + this.projName + ")"
		//cmake  adding executable 
		let cmakeSrcExecutable = "\nadd_executable(" + this.projName + " " + this.srcFileName +")"
		// cmake adding compile option
		let cmakeSrcCompileOpt = "\ntarget_compile_options(" + this.projName + " PRIVATE " + this.compilerflags +")"
		// cmake link libary
		let cmakeSrcLinkLib = "\ntarget_link_libraries(" + this.projName + " " + this.linkerflags +")"
		// hex file generator
		let hex = "add_custom_command(TARGET " + projName + " POST_BUILD COMMAND ${CMAKE_CURRENT_SOURCE_DIR}/core/compiler/bin/avr-objcopy -O ihex -R .eeprom " + projName + " " + projName + ".hex)\n"
		// bin file generator
		let bin = "add_custom_command(TARGET " + projName + " POST_BUILD COMMAND ${CMAKE_CURRENT_SOURCE_DIR}/core/compiler/bin/avr-objcopy -O binary -R .eeprom " + projName + " " + projName + ".bin)\n"

		//resets Cmake File
		if (fs.existsSync(this.projDir + "/CMakeLists.txt")) {
			fs.unlinkSync(this.projDir + "/CMakeLists.txt")
		}
		if (fs.existsSync(this.projDir + "/Makefile")) {
			fs.unlinkSync(this.projDir + "/Makefile")
		}
		if (fs.existsSync(this.projDir + "/cmake_install.cmake")) {
			fs.unlinkSync(this.projDir + "/cmake_install.cmake")
		}
		if (fs.existsSync(this.projDir + "/CMakeCache.txt")) {
			fs.unlinkSync(this.projDir + "/CMakeCache.txt")
		}
		if (fs.existsSync(this.projDir + "/CMakeFiles")) {
			fs.rmSync(this.projDir + "/CMakeFiles", { recursive: true, force: true })
		}

		fs.writeFileSync(this.projDir + "/CMakeLists.txt", cmakeHeader);
		fs.appendFileSync(this.projDir + "/CMakeLists.txt", cmakeSrcExecutable);
		fs.appendFileSync(this.projDir + "/CMakeLists.txt", cmakeSrcCompileOpt);
		fs.appendFileSync(this.projDir + "/CMakeLists.txt", cmakeSrcLinkLib);
		fs.appendFileSync(projDir + "/CMakeLists.txt", hex);
		fs.appendFileSync(projDir + "/CMakeLists.txt", bin);

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
