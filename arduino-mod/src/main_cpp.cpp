#include <iostream>
#include <cstdlib>

void compileLibrary(const std::string& sourceFile, const std::string& objectFile) {
    // Construct the compilation command
    std::string compileCommand = "g++ -c " + sourceFile + " -o " + objectFile;

    // Execute the compilation command
    int result = std::system(compileCommand.c_str());

    // Check the result of the compilation
    if (result == 0) {
        std::cout << "Compilation successful: " << objectFile << std::endl;
    } else {
        std::cerr << "Compilation failed for: " << sourceFile << std::endl;
    }
}

int main(int argc, char* argv[]) {
    if (argc != 3) {
        std::cerr << "Usage: " << argv[0] << " <source_file> <object_file>" << std::endl;
        return 1;
    }

    // Call compileLibrary with command-line arguments
    compileLibrary(argv[1], argv[2]);

    return 0;
}