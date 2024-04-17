# Arduino Importer Extension
We created a VS Code Extension with a simple GUI that allows users to generate self-contained Cmake projects from prexisting Arduino projects. Our extension allows to select board-specific compilation flags, such as optimization flags. Advanced users can override default flags through a customizable configuration file. After the user finishes their selections, our extension imports the required core libraries and any third-party libraries used by the origional project. The default compilation flags are dynamically generated from platform.txt and boards.txt for the board specified.

After the CMake project is created, our extension automatically compiles the project and opnes the build directory, which include a .elf, .hex, .lst, and .map file. After being generated, the generated Cmake project can then be imported into professional IDEs.

This project currently only supports the Windows operating system.
## User Guide

### Import Requirements
+ The selected Arduino project must be contained within a single .ino sketch file
+ The selected Arduino project must compile within the Arduino IDE
+ Arduino projects using the DxCore family must include flags_overide.txt in their destination folder.

### Targeted Boards
This extension currently only supports importing projects for the following microprocessors:
+ DxCore Family
+ ATmega328P Xplained Mini (Referred to as Nano)

### User Dependencies 
+ Arduino 2.0 or greater
+ Cmake
+ Board-Specific Core Libraries (E.g. DxCore core library)

### Flag Override
Flags can be overwritten by creating *flag_override.txt* file and placing the file in the destination directory of the project. This functionality is intended for advanced users that desire to customize the flag options used to compile their embedded project. Most users may not need to customize compile options to this extent and can use the default options.

The process of setting flags is similar to the structure of boards.txt for the Arduino IDE. Users can choose specific compiler options that they wish for their project to use.

DxCore users must use flags_override.txt to set speed, clocksource, wiremode, millistimer, attachmode, and flmapopts. Below is an example of the default configuration that a user may use:

```
build.speed=24
build.clocksource=0
build.wiremode=MORS_SINGLE
build.millistimer=B2
build.attachmode=-DCORE_ATTACH_ALL
build.flmapopts=-DLOCK_FLMAP -DFLMAPSECTION1
```
Alternative compilation options can be found in boads.txt and platforms.txt. The use of flag_override.txt is not required for Nano users.

### Extension Instruction
1. Download the .vsix file
2. Navigate to extension panel
3. Under go to "Views and more action" click install VSIX
4. Navigate to the .vsix file and install

### Notice Regarding Third-Party Libraries
Users are advised to be aware of the licensing terms of third-party libraries. All third-party libraries are compiled into a single static library file (.a) and are statically linked to source code at run time.

## Building
1. Install npm
2. Run `npm install -g yo generator-code typescript`
3. Open arduino-mod/ in VSCode
4. Press F5 to open an extension development window
6. Type "> Arduino Import Module" into the search bar at the top of the new VSCode window.

## Contributors
<a href="https://github.com/jcnguye/Arduino_Import_Module/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=jcnguye/Arduino_Import_Module" />
</a>

## License
This extension is licensed under the MIT license. See [LICENSE](LICENSE) for further information.




