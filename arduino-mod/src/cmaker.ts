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
	public setProjectDirectory(){
		this.projDir = "C:\Users\nguye\Desktop\SER\SER2023_SPRING\SER_CAP\Arduino_Import_Module\arduino-mod";
	}
	public setProjectName(){
		this.projName = "testproj"
	}
	public setSourceName(){
		this.srcFileName = "sketch.cpp"
	}
	public setCompilerFlags(){
		this.compilerflags = '-c -g -Os -Wall -std=gnu++17 -fpermissive -Wno-sized-deallocation -fno-exceptions -ffunction-sections -fdata-sections -fno-threadsafe-statics -Wno-error=narrowing -MMD -flto -mrelax -mmcu=avr64dd32 -DF_CPU=24000000L -DCLOCK_SOURCE=0 -DTWI_MORS_SINGLE -DMILLIS_USE_TIMERB2 -DCORE_ATTACH_ALL -DLOCK_FLMAP -DFLMAPSECTION1 -DARDUINO=10607 -DARDUINO_avrdd -DARDUINO_ARCH_MEGAAVR -DDXCORE="1.5.10" -DDXCORE_MAJOR=1UL -DDXCORE_MINOR=5UL -DDXCORE_PATCH=10UL -DDXCORE_RELEASED=1 -DMVIO_ENABLED -I/Users/Cole/Library/Arduino15/packages/DxCore/hardware/megaavr/1.5.10/cores/dxcore/api/deprecated -I/Users/Cole/Library/Arduino15/packages/DxCore/hardware/megaavr/1.5.10/cores/dxcore -I/Users/Cole/Library/Arduino15/packages/DxCore/hardware/megaavr/1.5.10/variants/32pin-ddseries'
	}
	public setLinkerFlags(){
		this.linkerflags = '-Wall -Wextra -Os -g -flto -fuse-linker-plugin -mrelax -Wl,--gc-sections,--section-start=.text=0x0,--section-start=.FLMAP_SECTION1=0x8000,--section-start=.FLMAP_SECTION2=0x10000,--section-start=.FLMAP_SECTION3=0x18000 -mmcu=avr64dd32'
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

		// use fs.appendFileSync(projDir + "/CMakeLists.txt", data); for future appends

	}
}

export default Cmaker;
