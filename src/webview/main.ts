import { provideVSCodeDesignSystem, vsCodeButton, Button, Dropdown, vsCodeDropdown, Radio, vsCodeRadio, RadioGroup, vsCodeRadioGroup, vsCodeOption } from "@vscode/webview-ui-toolkit";

provideVSCodeDesignSystem().register(
  vsCodeButton(),
  vsCodeDropdown(),
  vsCodeOption(),
  vsCodeRadio(),
  vsCodeRadioGroup()
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
  boardDropdown?.addEventListener("change", handleBoardChange);

  const boardOptGroup = document.getElementById("boardOpt") as RadioGroup;
  boardOptGroup?.addEventListener("change", handleBoardOptChange);

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
    command: "import", 
  });
}

function handleBoardChange(){
  const boardDropdown = document.getElementById("board") as Dropdown;
  this.selectedBoard = boardDropdown.value;
  vscodeApi.postMessage({
    command: "board",
    text: this.selectedBoard, 
  });
}

function handleBoardOptChange(){
  const boardOptGroup = document.getElementById("boardOpt") as RadioGroup;
  boardOptGroup.value;
  vscodeApi.postMessage({
    command: "boardOpt",
    text: boardOptGroup.value, 
  });
}



