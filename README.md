# Arduino Importer Extension
This project involves the design and implementation of a Visual Studio Code extension that scans, analyzes, and creates a self-contained Cmake project from of a Arduino Sketch. This extension copies not only the base sketch (.ino) file, but all other peripheral and core support libraries. 

The plug in will also allow observation and setting of all compiler and linker build flags for the specified C++ tool tail in order to optimize for source level debugging or production level images. After the plug in has created the CMake version of the Arduino project into the target directory so specified the module will then compile the project to the resulting artifact specified by the user, be it a HEX or ELF file.

This project is currently only aiming to support the Windows operating system.
## User Guide

### Targeted Boards
This extension currently only supports importing sketches for the following microprocessors:
+ DxCore Family
+ ATmega328P Xplained Mini (Referred to as Nano)

### User Dependencies 
+ Arduino 2.0 or greater
+ Cmake 
+ Board-Specific Core Libraries (E.g. DxCore core library)

### Flag Override
Flags can be overwritten by creating *flag_override.txt* and placing the file in the destination directory of the project. This functionality is intended for advanced users that desire to customize the flag options used to compile their embedded project. Most users may not need to customize compile options to this extent and can use the default options.

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

The use of flag_override.txt is optional for Nano users. 

### Requirements
+ Selected sketch files must be contained within a single file
+ Selected sketch files must compile within the Arduino IDE
+ DxCore projects require the usage of flags_overide.txt

### Extension Download Instruction 
1. Download the .vsix file
2. Navigate to extension panel
3. Under go to "Views and more action" click install VSIX
4. Navigate to the .vsix file and install

### Platforms
This extension only supports the Windows operating system.

### Notice Regarding Third-Party Libraries

Users are advised to be aware of the licensing terms of third-party libraries. All third-party libraries are compiled into a single static library file (.a) and are statically linked to source code at run time.

## Building
1. Install npm
2. Run `npm install -g yo generator-code typescript`
3. Within arduino-mod/, run `tsc --watch`
4. Open the project in VSCode
5. Press F5 to open a new VSCode instance with the extension running.
6. Type "> Arduino Import Module" into the search bar at the top of the new VSCode window.

## Contributors

<a href="https://github.com/jcnguye/Arduino_Import_Module/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=jcnguye/Arduino_Import_Module" />
</a>

## License
This extension is licensed under the MIT license. See [LICENSE](LICENSE) for further information.




