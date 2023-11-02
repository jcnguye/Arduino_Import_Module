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

  setVSCodeMessageListener();
}

function setVSCodeMessageListener() {
  window.addEventListener("message", (event) => {
    const command = event.data.command;

    switch (command) {
      case "sketchPath":
        const sketchPath = document.getElementById("sketchPath");
        if (sketchPath){
          sketchPath.textContent = 'Selected sketch: ' + event.data.message;
        } 
        break;
      case "dirPath":
        const dirPath = document.getElementById("dirPath");
        if (dirPath){
          dirPath.textContent = 'Selected directory: ' + event.data.message;
        } 
        break;
      case "showOptions":
        const options = document.getElementById("options");
        if (options){
          options.classList.remove("hidden");
        } 
        break;
      
    }
  });
}

function displayLoadingState() {
  const loading = document.getElementById("loading");
  const icon = document.getElementById("icon");
  const summary = document.getElementById("summary");
  if (loading && icon && summary) {
    loading.classList.remove("hidden");
    icon.classList.add("hidden");
    summary.textContent = "Getting weather...";
  }
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
  boardDropdown.value;
  vscodeApi.postMessage({
    command: "board",
    text: boardDropdown.value, 
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



