#include <iostream>
#include <cstdlib>

// compiles library files into .o files
void compileOFile(const std::string& libraryFile, const std::string& objectFileName) {
    // Construct the compilation command
    std::string compileCommand = "g++ -c " + libraryFile + " -o " + objectFileName+".o";

    // Execute the compilation command
    int result = std::system(compileCommand.c_str());

    // Check the result of the compilation
    if (result == 0) {
        std::cout << "Compilation successful: " << objectFileName << std::endl;
    } else {
        std::cerr << "Compilation failed for: " << libraryFile << std::endl;
    }
}

// creates static library (.a) from .o files
void createStaticLibrary(){
    int libraryResult = system("lib /OUT:mylibrary.lib *.o");

    if (libraryResult != 0) {
        std::cerr << "Error: Library creation failed." << std::endl;
    } else {
        std::cout << "Static library created: mylibrary.lib" << std::endl;
    }
}

int main(int argc, char* argv[]) {
    if (argc != 3) {
        std::cerr << "Usage: " << argv[0] << " <source_file> <object_file>" << std::endl;
        return 1;
    }

    // Call compileLibrary with command-line arguments
    compileOFile(argv[1], argv[2]);

    return 0;
}