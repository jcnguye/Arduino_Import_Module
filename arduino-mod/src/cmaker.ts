import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { Board } from './board';
import {CMAKE} from './constants';


/**
 * This class configures and writes the CMakeLists.txt file to build
 * an arduino project using the Arduino IDE's compiler with cmake.
 */
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
	
	/**
	 * Constructs a CMaker.
	 *
	 * @param board The board to configure CMake for,
	 * @debuggingOptimization Whether or not to enable debugging optimization
	 */
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
	
	/**
	 * Resets all project directory contents related to CMake. Does not remove compiled files.
	 *
	 */
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
	
	/**
	 * Creates the CMakeLists.txt file within the project directory.
	 *
	 */
	public build(): void{
		// reset all cmake files before creating the new file
		this.resetCmake();
		
		//sets the cmake version
		let cmakeHeader = CMAKE.VERSION;
		
		const binPath = path.join(this.board.getPathToCompiler(), "bin");
		cmakeHeader = cmakeHeader + CMAKE.SET_C_COMPILER + path.join(binPath, CMAKE.C_COMPILER).replace(/\\/g, '/') + ')\n';
		cmakeHeader = cmakeHeader + CMAKE.SET_CXX_COMPILER + path.join(binPath, CMAKE.CXX_COMPILER).replace(/\\/g, '/') +')\n';
		cmakeHeader = cmakeHeader + CMAKE.SET_SYSTEM;

		cmakeHeader = cmakeHeader + CMAKE.PROJECT + this.projName + CMAKE.PROJECT_LANGUAGES;

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
		cmakeHeader = cmakeHeader + CMAKE.SET_C_LINKER_FLAGS + this.board.getCFlagsLinker() +  CMAKE.CMAKE_FILES_PATH + this.projName + '.dir/' + this.projName + 
		CMAKE.ELF_BUILD_PATH + this.projName + '.dir/' + this.projName + CMAKE.LIB_CORE_PATH;

		// map file generator
		cmakeHeader = cmakeHeader + CMAKE.MAP_GEN + this.projName +'.map")\n';

		//cmake  adding executable 
		let cmakeSrcExecutable = CMAKE.ADD_EXECUTABLE + this.projName + '.elf ' + this.srcFileName +")\n";
		cmakeSrcExecutable = cmakeSrcExecutable + CMAKE.SET_TARGET_PROPERTIES + this.projName + CMAKE.ELF_PROP;
		
		let cmakeDir = "";

		if(this.board.boardName === "Nano") {
			cmakeDir = CMAKE.NANO_INCLUDE;
		} else if(this.board.boardName === "DxCore") {
			
			cmakeDir = CMAKE.DXCORE_OPTIMIZATION;
			cmakeDir = cmakeDir + CMAKE.DXCORE_INCLUDE;
		} else {
			console.error("Board type not defined");
		}
		
		
		cmakeDir = cmakeDir + CMAKE.CORE_SRC;
		cmakeDir = cmakeDir + CMAKE.LIB_SRC;

		if (this.includeUtilitiesDir) {
			cmakeDir = cmakeDir + CMAKE.UTIL_DIR;
			cmakeDir = cmakeDir + CMAKE.UTIL_SRC;
			cmakeDir = cmakeDir + CMAKE.ADD_LIB_UTIL; 
		} else {
			cmakeDir = cmakeDir + CMAKE.ADD_LIB; 
		}	
		cmakeDir = cmakeDir + CMAKE.TARGET_LINK_LIBRARIES +  this.projName + CMAKE.ELF_CORE;
		
		// hex file generator
		let hex = CMAKE.HEX_PATH + this.projName + '.hex")\n';
		hex = hex + CMAKE.CUSTOM_TARGET + this.projName + CMAKE.ELF_POST_BUILD + this.projName + CMAKE.ELF_GEN;
		hex = hex + CMAKE.HEX_GEN;

		// set .elf and .map to go to output folder
		let elf = CMAKE.ELF_DIR + this.projName + '.elf")\n';
		let map = CMAKE.MAP_DIR + this.projName + '.map")\n';
		
		
		// generate lst file
		let lst = CMAKE.LST_DIR+ this.projName + '.lst")\n';
		lst = lst + CMAKE.CUSTOM_TARGET + this.projName + CMAKE.ELF_POST_BUILD_COMMAND + this.projName + CMAKE.ELF_COMMENT;
		lst = lst + CMAKE.GEN_LST;
		
		
		
		// write final output
		let output = cmakeHeader + cmakeSrcExecutable + cmakeDir + hex + elf + map + lst;
		if(process.platform !== "win32") {
			output = output.replace(/\.exe/g, "");
		}
		fs.writeFileSync(this.projDir + CMAKE.FILE_NAME, output);

	}
}

export default Cmaker;
