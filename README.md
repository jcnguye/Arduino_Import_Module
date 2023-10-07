# Arduino_Import_Module

## Overview
The project involves the design and implementation of a Visual Studio Code plugin module that will scan, analyze and create a CMake based self contained project out of a Arduino Sketch. This CMake project will copy not only the base sketch (.ino) file but all other peripheral and core support libraries. 

The plug in will also allow observation and setting of all compiler and linker build flags for the specified C++ tool tail in order to optimize for source level debugging or production level images. After the plug in has created the CMake version of the Arduino project into the target directory so specified the module will then compile the project to the resulting artifact specified by the user, be it a HEX or ELF file.

## Dependencies

This project requies the following module dependencies:

+ vscode
+ fs
+ path
+ readline
