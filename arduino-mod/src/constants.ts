export const CMAKE = {
    //General cmake
    FILE_NAME : "/CmakeLists.txt",
    VERSION: 'cmake_minimum_required(VERSION 3.28)\n',
    TARGET_LINK_LIB: 'target_link_libraries(',
    ADD_EXECUTABLE: 'add_executable(',
    SET_TARGET_PROPERTIES: 'set_target_properties(',
    PROJECT: 'project(',
    PROJECT_LANGUAGES: ' C CXX)\n\n',

    //set compiler
    SET_C_COMPILER: 'set(CMAKE_C_COMPILER ',
    SET_CXX_COMPILER: 'set(CMAKE_CXX_COMPILER ',
    SET_AR: 'set(CMAKE_AR ',
    SET_OBJ_COPY: 'set(CMAKE_OBJCOPY ',
    SET_OBJ_DUMP: 'set(CMAKE_OBJDUMP ',

    //compiler info
    C_COMPILER: 'avr-gcc.exe',
    CXX_COMPILER: 'avr-g++.exe',
    AVR: 'avr-gcc-ar.exe',
    OBJ_COPY: 'avr-objcopy.exe',
    OBJ_DUMP: 'avr-objdump.exe',
    SET_SYSTEM: 'set(CMAKE_SYSTEM_NAME Generic)\n\n',

    //setting project directories
    SET_CORE_DIR: 'set(CORE_DIR ${CMAKE_CURRENT_SOURCE_DIR}/core)\n',
    SET_LIB_DIR: 'set(LIB_DIR ${CMAKE_CURRENT_SOURCE_DIR}/lib)\n\n',
    NANO_INCLUDE: 'include_directories("${CMAKE_CURRENT_SOURCE_DIR}/core" "${CMAKE_CURRENT_SOURCE_DIR}/lib" "${CMAKE_CURRENT_SOURCE_DIR}/core/eightanaloginputs" "${CMAKE_CURRENT_SOURCE_DIR}/core/standard")\n',
    DXCORE_INCLUDE: 'include_directories("${CMAKE_CURRENT_SOURCE_DIR}/core" "${CMAKE_CURRENT_SOURCE_DIR}/core/deprecated" "${CMAKE_CURRENT_SOURCE_DIR}/core/32pin-ddseries")\n',

    //setting flags
    SET_CXX_FLAGS: 'set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} ',
    SET_C_FLAGS: 'set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} ',
    SET_STATIC_LIBRARY_FLAGS: 'set(CMAKE_STATIC_LIBRARY_FLAGS "rcs")\n',
    SET_C_LINKER_FLAGS: 'set(CMAKE_C_FLAGS_LINKER "${CMAKE_C_FLAGS_LINKER} ',

    //build directories
    BUILD_DIR: '${CMAKE_CURRENT_SOURCE_DIR}/build/CMakeFiles/',
    ELF_BUILD_DIR: '.elf ${CMAKE_CURRENT_SOURCE_DIR}/build/CMakeFiles/',
    LIB_CORE_DIR: '.cpp.o ${CMAKE_CURRENT_SOURCE_DIR}/build/libcore.a -L${CMAKE_CURRENT_SOURCE_DIR}/build -lm")\n\n',
    MAP_BUILD_DIR: 'set(CMAKE_EXE_LINKER_FLAGS "${CMAKE_EXE_LINKER_FLAGS} -Wl,-Map=${CMAKE_BINARY_DIR}/output/',
    ELF_INSTRUCTIONS: '.elf PROPERTIES RUNTIME_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/output)\n',

    //set src file types
    GLOBAL_CORE: 'file(GLOB CORE_SOURCES "${CORE_DIR}/*.cpp" "${CORE_DIR}/*.c")\n',
    GLOBAL_LIB: 'file(GLOB LIB_SOURCES "${LIB_DIR}/*.cpp" "${LIB_DIR}/*.c")\n',

    //including directories and static lib
    UTIL_DIR: 'set(UTIL_DIR ${CMAKE_CURRENT_SOURCE_DIR}/core/utility)\n',
    UTIL_SOURCE: 'file(GLOB UTIL_SOURCES "${UTIL_DIR}/*.cpp" "${UTIL_DIR}/*.c")\n',
    ADD_LIB_AND_UTILS: 'add_library(core STATIC ${CORE_SOURCES} ${LIB_SOURCES} ${UTIL_SOURCES})\n',
    ADD_LIB: 'add_library(core STATIC ${CORE_SOURCES} ${LIB_SOURCES})\n',

    //custom target generation
    HEX_FILE_OUTPUT_PATH: 'set(HEX_FILE_OUTPUT_PATH "${CMAKE_CURRENT_BINARY_DIR}/output/',
    ELF_POST_BUILD: '.elf POST_BUILD COMMAND ${CMAKE_OBJCOPY} -O ihex $<TARGET_FILE:',
    ELF_COMMAND: '.elf> ${HEX_FILE_OUTPUT_PATH} COMMENT "Generating HEX file")\n',
    GENERATE_DEPENDENCIES: '\n\nadd_custom_target(GenerateHex ALL DEPENDS ${HEX_FILE_OUTPUT_PATH} COMMENT "Building HEX file")\n',
    ADD_CUSTOM_TARGET: 'add_custom_command(TARGET ',
    ELF_DISASSEMBLE: '.elf POST_BUILD COMMAND ${CMAKE_OBJDUMP} --disassemble --source --line-numbers --demangle --section=.text $<TARGET_FILE:',
    ELF_GEN_COMMAND: '.elf> > ${LST_FILE_OUTPUT_PATH} COMMENT "Generating LST file")\n',
    GENERATE_ALL: 'GenerateLst ALL DEPENDS ${LST_FILE_OUTPUT_PATH} COMMENT "Building LST file")\n',
    TARGET: 'add_custom_target(GenerateLst ALL DEPENDS ${LST_FILE_OUTPUT_PATH} COMMENT "Building LST file")\n',
    
    //Setting file output directories
    ELF_DIR: 'set(ELF_FILE_OUTPUT_PATH "${CMAKE_CURRENT_BINARY_DIR}/output/',
    MAP_DIR: 'set(MAP_FILE_OUTPUT_PATH "${CMAKE_CURRENT_BINARY_DIR}/output/',
    LST_DIR: 'set(LST_FILE_OUTPUT_PATH "${CMAKE_CURRENT_BINARY_DIR}/output/'
}

export const NANO_FLAGS = {
    //Hardcoded flags added
    BUILD_ARCH_FLAG: 'build.arch',
    BUILD_ARCH: 'AVR',
    RUNTIME_VERSION_FLAG: 'runtime.ide.version',
    RUNTIME_VERSION: '10607',

    //Flags replaced
    ORIG_FNO: '-fno-fat-lto-objects',
    REPLACE_FNO: '-fno-fat-lto-objects -ffat-lto-objects',
    ORIG_FLTO: '-flto',
    REPLACE_FLTO: '-flto -fno-fat-lto-objects -ffat-lto-objects'
}

export const DXCORE_FLAGS = {
    //hardcoded flags
    ARCH_FLAG: 'build.arch',
    ARCH: 'MEGAAVR',
    RUNTIME_VERSION_FLAG: 'runtime.ide.version',
    RUNTIME_VERSION: '10607',
    FCPU_FLAG: 'build.f_cpu',
    FCPU: '10607',
    CLOCK_SOURCE_FLAG: 'build.clocksource',
    CLOCK_SOURCE: '0',
    WIRE_FLAG: 'build.wiremode',
    WIRE: 'MORS_SINGLE',
    MILLIS_TIMER_FLAG: 'build.millistimer',
    MILLIS_TIMER: 'B2',
    ATTACH_MODE_FLAG: 'build.attachmode',
    ATTACH_MODE: '-DCORE_ATTACH_ALL',
    FLM_FLAG: 'build.flmapopts',
    FLM: '-DLOCK_FLMAP -DFLMAPSECTION1',
    BOOTLOADER: 'bootloader.appspm',
    DOWNLOADED_FILE: 'DOWNLOADED_FILE#"v"',
    VERSION: 'version',

    //Flag replacements
    ORIG_FNO: '-fno-fat-lto-objects',
    REPLACE_FNO: '-fno-fat-lto-objects -ffat-lto-objects',
    ORIG_FLTO: '-flto',
    REPLACE_FLTO: '-flto -fno-fat-lto-objects -ffat-lto-objects'
}

export const RECIPES = {
    //recipes for flag parsing
    C_COMBINE_RECIPE: 'recipe.c.combine.pattern',
    C_O_RECIPE: 'recipe.c.combine.pattern',
    CPP_O_RECIPE: 'recipe.cpp.o.pattern'
}