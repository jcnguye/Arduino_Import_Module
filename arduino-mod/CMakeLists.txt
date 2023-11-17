# NOTE: this file is just for any C++ files we eventually have and is not used for Typescript

# minimum version of CMake needed
cmake_minimum_required(VERSION 3.10)
# sets project name
project(arduino-import-module)

# specifies src files (this needs to be changed to the real C++ file(s) eventually)
set(SOURCES
	src/temp_cpp_file.cpp
)

# add executable target
add_executable(${PROJECT_NAME} ${SOURCES})

# might eventually need to add any external libraries we use