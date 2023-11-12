import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export class Cmaker {
	public projDir: string;
	public projName: string;
	public srcName: string;
	public compilerflags: string;
	public linkerflags: string;
	
	constructor(){
		this.projDir = "";
		this.projName = "";
		this.srcName = "";
		this.compilerflags = "";
		this.linkerflags = "";
	}

	public runCmakeSetUp(): void{
		this.resetCmakeFiles(this.projDir);
		this.cmakeSkeleton(this.projDir, this.projName);
		this.addSourceFile(this.projDir,this.projName,this.srcName);
		this.addCompilerFlags(this.projDir,this.projName,this.compilerflags);
		this.addLinkerFlags(this.projDir,this.projName,this.linkerflags);
	}

	public resetCmakeFiles(projDir: string) {
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

	public cmakeSkeleton(projDir: string, projName: string) {
		let cmakeHeader = "cmake_minimum_required(VERSION 3.0)"
		cmakeHeader = cmakeHeader + '\nset(CMAKE_C_COMPILER "${CMAKE_CURRENT_SOURCE_DIR}/core/compiler/bin/avr-gcc")'
		cmakeHeader = cmakeHeader + '\nset(CMAKE_CXX_COMPILER "${CMAKE_CURRENT_SOURCE_DIR}/core/compiler/bin/avr-g++")'
		cmakeHeader = cmakeHeader + "\nproject(" + projName + ")"
		fs.writeFileSync(projDir + "/CMakeLists.txt", cmakeHeader);
		// use fs.appendFileSync(projDir + "/CMakeLists.txt", data); for future appends
	}

	public addSourceFile(projDir: string, projName: string, srcName: string) {
		let cmakeSrc = "\nadd_executable(" + projName + " " + srcName +")"
		fs.appendFileSync(projDir + "/CMakeLists.txt", cmakeSrc);
	}

	public addCompilerFlags(projDir: string, projName: string, flags: string) {
		let cmakeSrc = "\ntarget_compile_options(" + projName + " PRIVATE " + flags +")"
		fs.appendFileSync(projDir + "/CMakeLists.txt", cmakeSrc);
	}

	public addLinkerFlags(projDir: string, projName: string, flags: string) {
		let cmakeSrc = "\ntarget_link_libraries(" + projName + " " + flags +")"
		fs.appendFileSync(projDir + "/CMakeLists.txt", cmakeSrc);
	}

}

export default Cmaker;
