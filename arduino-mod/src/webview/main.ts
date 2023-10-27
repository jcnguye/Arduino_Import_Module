import { provideVSCodeDesignSystem, vsCodeButton, Button, Dropdown, vsCodeDropdown, vsCodeOption } from "@vscode/webview-ui-toolkit";

provideVSCodeDesignSystem().register(
  vsCodeButton(),
  vsCodeDropdown(),
  vsCodeOption()
);

// Get access to the VS Code API from within the webview context

const vscodeApi = acquireVsCodeApi();


// wait for the webview DOM to load 
window.addEventListener("load", main);

// Main function that gets executed once the webview DOM loads
function main() {

  const sketchButton = document.getElementById("sketchFile") as Button;
  sketchButton?.addEventListener("click", handleSketchClick);

  const boardDropdown = document.getElementById("board") as Dropdown;
  boardDropdown?.addEventListener("change", handleBoardSelection);

  const importButton = document.getElementById("import") as Button;
  importButton?.addEventListener("click", handleImportClick);

  const directoryButton = document.getElementById("destDir") as Button;
  directoryButton?.addEventListener("click", handleDirectoryClick);
}

function handleSketchClick(){
  vscodeApi.postMessage({
    command: "sketch",
  });
}

function handleDirectoryClick(){
  vscodeApi.postMessage({
    command: "directory", 
  });
}

function handleImportClick(){
  vscodeApi.postMessage({
    command: "info", //TODO - change this
    text: "", //TODO 
  });
}

function handleBoardSelection(){
  const boardDropdown = document.getElementById("board") as Dropdown;
  boardDropdown.value;
  vscodeApi.postMessage({
    command: "board",
    text: boardDropdown.value, 
  });
}



