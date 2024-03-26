export const CMAKE = {
    FILE_NAME : "/CmakeLists.txt",
    VERSION: 'cmake_minimum_required(VERSION 3.28)\n',
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
    ELF_DIR: 'set(ELF_FILE_OUTPUT_PATH "${CMAKE_CURRENT_BINARY_DIR}/output/',
    MAP_DIR: 'set(MAP_FILE_OUTPUT_PATH "${CMAKE_CURRENT_BINARY_DIR}/output/',
    LST_DIR: 'set(LST_FILE_OUTPUT_PATH "${CMAKE_CURRENT_BINARY_DIR}/output/'
}