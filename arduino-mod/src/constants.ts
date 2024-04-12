export const CMAKE = {
    FILE_NAME : "/CmakeLists.txt",
    VERSION: 'cmake_minimum_required(VERSION 3.28)\n',
    CUSTOM_TARGET: 'add_custom_command(TARGET ',
    SET_TARGET_PROPERTIES: 'set_target_properties(',
    TARGET_LINK_LIBRARIES: 'target_link_libraries(',
    PROJECT: 'project(',
    PROJECT_LANGUAGES: ' C CXX)\n\n',
    ADD_EXECUTABLE: 'add_executable(',

    SET_C_COMPILER: 'set(CMAKE_C_COMPILER ',
    SET_CXX_COMPILER: 'set(CMAKE_CXX_COMPILER ',
    SET_AR: 'set(CMAKE_AR ',
    SET_OBJ_COPY: 'set(CMAKE_OBJCOPY ',
    SET_OBJ_DUMP: 'set(CMAKE_OBJDUMP ',

    C_COMPILER: 'avr-gcc.exe',
    CXX_COMPILER: 'avr-g++.exe',
    AVR: 'avr-gcc-ar.exe',
    OBJ_COPY: 'avr-objcopy.exe',
    OBJ_DUMP: 'avr-objdump.exe',
    SET_SYSTEM: 'set(CMAKE_SYSTEM_NAME Generic)\n\n',

    SET_CXX_FLAGS: 'set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} ',
    SET_C_FLAGS: 'set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} ',
    SET_STATIC_LIBRARY_FLAGS: 'set(CMAKE_STATIC_LIBRARY_FLAGS "rcs")\n',
    SET_C_LINKER_FLAGS: 'set(CMAKE_C_FLAGS_LINKER "${CMAKE_C_FLAGS_LINKER} ',

    SET_CORE_DIR: 'set(CORE_DIR ${CMAKE_CURRENT_SOURCE_DIR}/core)\n',
    SET_LIB_DIR: 'set(LIB_DIR ${CMAKE_CURRENT_SOURCE_DIR}/lib)\n\n',
    NANO_INCLUDE: 'include_directories("${CMAKE_CURRENT_SOURCE_DIR}/core" "${CMAKE_CURRENT_SOURCE_DIR}/lib" "${CMAKE_CURRENT_SOURCE_DIR}/core/eightanaloginputs" "${CMAKE_CURRENT_SOURCE_DIR}/core/standard")\n',
    DXCORE_INCLUDE: 'include_directories("${CMAKE_CURRENT_SOURCE_DIR}/core" "${CMAKE_CURRENT_SOURCE_DIR}/core/deprecated" "${CMAKE_CURRENT_SOURCE_DIR}/core/32pin-ddseries")\n',
    DXCORE_OPTIMIZATION: 'set(CMAKE_INTERPROCEDURAL_OPTIMIZATION TRUE)\n',

    MAP_GEN: 'set(CMAKE_EXE_LINKER_FLAGS "${CMAKE_EXE_LINKER_FLAGS} -Wl,-Map=${CMAKE_BINARY_DIR}/output/',
    ELF_PROP: '.elf PROPERTIES RUNTIME_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/output)\n',
    CORE_SRC: 'file(GLOB CORE_SOURCES "${CORE_DIR}/*.cpp" "${CORE_DIR}/*.c")\n',
    LIB_SRC: 'file(GLOB LIB_SOURCES "${LIB_DIR}/*.cpp" "${LIB_DIR}/*.c")\n',

    UTIL_DIR: 'set(UTIL_DIR ${CMAKE_CURRENT_SOURCE_DIR}/core/utility)\n',
    UTIL_SRC: 'file(GLOB UTIL_SOURCES "${UTIL_DIR}/*.cpp" "${UTIL_DIR}/*.c")\n',
    ADD_LIB_UTIL: 'add_library(core STATIC ${CORE_SOURCES} ${LIB_SOURCES} ${UTIL_SOURCES})\n',
    ADD_LIB: 'add_library(core STATIC ${CORE_SOURCES} ${LIB_SOURCES})\n',

    HEX_PATH: 'set(HEX_FILE_OUTPUT_PATH "${CMAKE_CURRENT_BINARY_DIR}/output/',
    ELF_POST_BUILD: '.elf POST_BUILD COMMAND ${CMAKE_OBJCOPY} -O ihex $<TARGET_FILE:',
    ELF_GEN: '.elf> ${HEX_FILE_OUTPUT_PATH} COMMENT "Generating HEX file")\n',
    HEX_GEN: '\n\nadd_custom_target(GenerateHex ALL DEPENDS ${HEX_FILE_OUTPUT_PATH} COMMENT "Building HEX file")\n',
    ELF_POST_BUILD_COMMAND: '.elf POST_BUILD COMMAND ${CMAKE_OBJDUMP} --disassemble --source --line-numbers --demangle --section=.text $<TARGET_FILE:',
    ELF_COMMENT: '.elf> > ${LST_FILE_OUTPUT_PATH} COMMENT "Generating LST file")\n',
    GEN_LST: 'add_custom_target(GenerateLst ALL DEPENDS ${LST_FILE_OUTPUT_PATH} COMMENT "Building LST file")\n',

    
    ELF_DIR: 'set(ELF_FILE_OUTPUT_PATH "${CMAKE_CURRENT_BINARY_DIR}/output/',
    MAP_DIR: 'set(MAP_FILE_OUTPUT_PATH "${CMAKE_CURRENT_BINARY_DIR}/output/',
    LST_DIR: 'set(LST_FILE_OUTPUT_PATH "${CMAKE_CURRENT_BINARY_DIR}/output/',

    LIB_CORE_PATH: '.cpp.o ${CMAKE_CURRENT_SOURCE_DIR}/build/libcore.a -L${CMAKE_CURRENT_SOURCE_DIR}/build -lm")\n\n',
    CMAKE_FILES_PATH: '${CMAKE_CURRENT_SOURCE_DIR}/build/CMakeFiles/',
    ELF_BUILD_PATH: '.elf ${CMAKE_CURRENT_SOURCE_DIR}/build/CMakeFiles/',
    ELF_CORE: '.elf PRIVATE core)\n\n'
}

export const RECIPE = {
    C_COMBINE: 'recipe.c.combine.pattern',
    CPP_PATTERN: 'recipe.cpp.o.pattern',
    C_PATTERN: 'recipe.c.o.pattern',

    FNO_ORIG_C: '-fno-fat-lto-objects',
    FNO_ORIG_CPP: '-flto',
    FNO_REPLACE_CPP: '-flto -fno-fat-lto-objects -ffat-lto-objects',
    FNO_REPLACE_C: '-fno-fat-lto-objects -ffat-lto-objects'
}
    