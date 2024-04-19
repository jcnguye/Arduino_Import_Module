# Arduino Importer Extension
We created a VS Code Extension with a simple GUI that allows users to generate self-contained Cmake projects from pre-existing Arduino projects. Our extension allows users to select board-specific compilation flags, such as optimization flags. Advanced users can override default flags through a customizable configuration file. After the user finishes their selections, our extension imports the required core libraries and any third-party libraries used by the original project. The default compilation flags are dynamically generated from platform.txt and boards.txt for the board specified.

After the CMake project is created, our extension automatically compiles the project and opens the build directory, which include a .elf, .hex, .lst, and .map file. After being generated, the generated Cmake project can then be imported into professional IDEs.

This project  only supports the Windows operating system.
## User Guide

### Extension Requirements
+ The selected Arduino project must be contained within a single .ino sketch file
+ The selected Arduino project must compile within the Arduino IDE
+ Arduino projects using the DxCore family must include flag_overide.txt in their destination folder.
+ Arduino 2.0 or greater must be installed
+ Cmake and Make must be installed
+ Board-specific core libraries must be installed (E.g. DxCore library)

### Supported Boards
This extension only supports projects for the DxCore Family and the Arduino Nano Family

### Flag Override
Flags can be overwritten by creating *flag_override.txt* and placing the file in the destination directory of the project. This functionality is intended for advanced users that desire to customize the flag options used to compile their embedded project. Most users may not need to customize compile options to this extent and can use the default options.

The process of setting flags is similar to the structure of boards.txt for the Arduino IDE. Users can choose specific compiler options that they wish for their project to use.

DxCore users must use flag_override.txt to set clock speed, clock source, wire mode, millisecond timer, attach mode, and flash mapping. Below is an example of the default configuration that a user may use:

```
build.speed=24         //set clock speed to 24 MHz
build.clocksource=0    //set default clock source
build.wiremode=MORS_SINGLE    //set wire mode to MORS_SINGLE
build.millistimer=B2          //set timer B2 for millis()
build.attachmode=-DCORE_ATTACH_ALL    //Attach interrupts to all available pins
build.flmapopts=-DLOCK_FLMAP -DFLMAPSECTION1   //flash memory mapping options
```
The use of flag_override.txt is optional for Nano users. Nano-compatible boards typically have default settings handled by the extension.

NOTE: The 'flag_override.txt' file should only contain flag assignments. Comments are not permitted within the file.

### Error Handling
Error pop-up windows will be displayed for issues that prevent the extension from running correctly (like not having Cmake installed). Compilation issues with the imported project will put outputted in the extension console. You may need to separately run the generated Cmake project or makefile in order to detect the issue.

### Extension Usage Instruction 
1. Download the .vsix file
2. Navigate to extension panel
3. Under go to "Views and more action" click install VSIX
4. Navigate to the .vsix file and install

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




