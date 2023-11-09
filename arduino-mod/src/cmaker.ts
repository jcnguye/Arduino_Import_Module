import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export class Cmaker {
/*
	  cmaker.resetCmakeFiles("/Users/Cole/test")        
        cmaker.cmakeSkeleton("/Users/Cole/test", "testproj");
        cmaker.addSourceFile("/Users/Cole/test", "testproj", "sketch.cpp");
        cmaker.addCompilerFlags("/Users/Cole/test", "testproj", '-c -g -Os -Wall -std=gnu++17 -fpermissive -Wno-sized-deallocation -fno-exceptions -ffunction-sections -fdata-sections -fno-threadsafe-statics -Wno-error=narrowing -MMD -flto -mrelax -mmcu=avr64dd32 -DF_CPU=24000000L -DCLOCK_SOURCE=0 -DTWI_MORS_SINGLE -DMILLIS_USE_TIMERB2 -DCORE_ATTACH_ALL -DLOCK_FLMAP -DFLMAPSECTION1 -DARDUINO=10607 -DARDUINO_avrdd -DARDUINO_ARCH_MEGAAVR -DDXCORE="1.5.10" -DDXCORE_MAJOR=1UL -DDXCORE_MINOR=5UL -DDXCORE_PATCH=10UL -DDXCORE_RELEASED=1 -DMVIO_ENABLED -I/Users/Cole/Library/Arduino15/packages/DxCore/hardware/megaavr/1.5.10/cores/dxcore/api/deprecated -I/Users/Cole/Library/Arduino15/packages/DxCore/hardware/megaavr/1.5.10/cores/dxcore -I/Users/Cole/Library/Arduino15/packages/DxCore/hardware/megaavr/1.5.10/variants/32pin-ddseries');
        cmaker.addLinkerFlags("/Users/Cole/test", "testproj", '-Wall -Wextra -Os -g -flto -fuse-linker-plugin -mrelax -Wl,--gc-sections,--section-start=.text=0x0,--section-start=.FLMAP_SECTION1=0x8000,--section-start=.FLMAP_SECTION2=0x10000,--section-start=.FLMAP_SECTION3=0x18000 -mmcu=avr64dd32 -o');
        
	*/
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

	public runCmakeSetUp(){
		resetCmakeFiles(this.projDir);
		cmakeSkeleton(this.projDir, this.projName);
		addSourceFile(this.projDir,this.projName,this.srcName);
		addCompilerFlags(this.projDir,this.projName,this.compilerflags);
		addLinkerFlags(this.projDir,this.projName,this.linkerflags);

		/*
		  cmaker.resetCmakeFiles("/Users/Cole/test")        
        cmaker.cmakeSkeleton("/Users/Cole/test", "testproj");
        cmaker.addSourceFile("/Users/Cole/test", "testproj", "sketch.cpp");
        cmaker.addCompilerFlags("/Users/Cole/test", "testproj", '-c -g -Os -Wall -std=gnu++17 -fpermissive -Wno-sized-deallocation -fno-exceptions -ffunction-sections -fdata-sections -fno-threadsafe-statics -Wno-error=narrowing -MMD -flto -mrelax -mmcu=avr64dd32 -DF_CPU=24000000L -DCLOCK_SOURCE=0 -DTWI_MORS_SINGLE -DMILLIS_USE_TIMERB2 -DCORE_ATTACH_ALL -DLOCK_FLMAP -DFLMAPSECTION1 -DARDUINO=10607 -DARDUINO_avrdd -DARDUINO_ARCH_MEGAAVR -DDXCORE="1.5.10" -DDXCORE_MAJOR=1UL -DDXCORE_MINOR=5UL -DDXCORE_PATCH=10UL -DDXCORE_RELEASED=1 -DMVIO_ENABLED -I/Users/Cole/Library/Arduino15/packages/DxCore/hardware/megaavr/1.5.10/cores/dxcore/api/deprecated -I/Users/Cole/Library/Arduino15/packages/DxCore/hardware/megaavr/1.5.10/cores/dxcore -I/Users/Cole/Library/Arduino15/packages/DxCore/hardware/megaavr/1.5.10/variants/32pin-ddseries');
        cmaker.addLinkerFlags("/Users/Cole/test", "testproj", '-Wall -Wextra -Os -g -flto -fuse-linker-plugin -mrelax -Wl,--gc-sections,--section-start=.text=0x0,--section-start=.FLMAP_SECTION1=0x8000,--section-start=.FLMAP_SECTION2=0x10000,--section-start=.FLMAP_SECTION3=0x18000 -mmcu=avr64dd32 -o');
        
		*/
	}
}

export default Cmaker;

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