# Arduino_Import_Module
This project involves the design and implementation of a Visual Studio Code extension that scans, analyzes, and creates a self-contained Cmake project from of a Arduino Sketch. This extension copies not only the base sketch (.ino) file, but all other peripheral and core support libraries. 

The plug in will also allow observation and setting of all compiler and linker build flags for the specified C++ tool tail in order to optimize for source level debugging or production level images. After the plug in has created the CMake version of the Arduino project into the target directory so specified the module will then compile the project to the resulting artifact specified by the user, be it a HEX or ELF file.

This project is currently only aiming to support the Windows operating system.
## User Guide



### User Dependencies 
+ Arduino 2.0 or greater
+ Cmake 
+ Board-Specific Core Libraries (E.g. DxCore core library)

### Flag Override
Flags can be overwritten by placing *flag_override.txt* in the destination directory of the project. The plugin will look for six potenial areas to overwrite:
+ LINKER_REPLACE
+ LINKER_ADDITIONAL
+ CXX_REPLACE
+ CXX_ADDITIONAL
+ C_REPLACE
+ C_ADDITIONAL

For additional flags, enter a list of flags separated by a space, e.g.
```
LINKER_ADDITIONAL=-flag1 -flag2 -flag3
```

For replacement flags, the original flag should be followed by a colon (:) with the flag it will replace, with a space separating each entry, e.g.
```
CXX_REPLACE=-originalFlag:-replacementFlag -originalFlag2:-originalFlag2
```

Notice the use of dashes(-) in both lines.

### Requirements
+ Selected *.ino* sketch files must be contained within a single file
+ Selected *.ino* sketch files must compile within the Arduino IDE

### Extension Download Instruction 
1. Download the .vsix file
2. Navigate to extension panel 
3. Under go to "Views and more action" click install VSIX
4. Navigate to the .vsix file and install

### Notice Regarding Third-Party License Usage

Users are advised to be aware of the licensing terms of third-party libraries. All third-party libraries are compiled into a single static library file (.a) and are statically linked at 

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




