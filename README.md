# Arduino_Import_Module

## Overview
The project involves the design and implementation of a Visual Studio Code plugin module that will scan, analyze and create a CMake based self contained project out of a Arduino Sketch. This CMake project will copy not only the base sketch (.ino) file but all other peripheral and core support libraries. 

The plug in will also allow observation and setting of all compiler and linker build flags for the specified C++ tool tail in order to optimize for source level debugging or production level images. After the plug in has created the CMake version of the Arduino project into the target directory so specified the module will then compile the project to the resulting artifact specified by the user, be it a HEX or ELF file.

This project is currently only aiming to support the Windows operating system.


## Building
1. Install npm
2. Run `npm install -g yo generator-code typescript`
3. Within arduino-mod/, run `tsc --watch`
4. Open the project in VSCode
5. Press F5 to open a new VSCode instance with the extension running.
6. Type "> hello world" into the search bar at the top of the new VSCode window. (this should be changed to an appropriate command for building Arduino projects)

## Dependencies

This project requires the following modules:

+ vscode
+ fs
+ path
+ readline
