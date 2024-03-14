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

  const optimizeOptGroup = document.getElementById("optimizeOpt") as RadioGroup;
  optimizeOptGroup?.addEventListener("change", handleOptimizeOptChange);

  const importButton = document.getElementById("import") as Button;
  importButton?.addEventListener("click", handleImportClick);

  const directoryButton = document.getElementById("destDir") as Button;
  directoryButton?.addEventListener("click", handleDirectoryClick);

  //DxCore Options
  const dxChipDropdown = document.getElementById("dxChip") as Dropdown;
  dxChipDropdown?.addEventListener("change", handleDxChipChange);

  const dxPrintFDropdown = document.getElementById("dxPrintF") as Dropdown;
  dxPrintFDropdown?.addEventListener("change", handleDxPrintFChange);

  const dxMvioDropdown = document.getElementById("dxMvio") as Dropdown;
  dxMvioDropdown?.addEventListener("change", handleDxMvioChange);
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

function handleOptimizeOptChange(){
  const optimizeOptGroup = document.getElementById("optimizeOpt") as RadioGroup;
  vscodeApi.postMessage({
    command: "optimizeOpt",
    text: optimizeOptGroup.value, 
  });
}

//DxCore Options
function handleDxChipChange(){
  const dxChipDropdown = document.getElementById("dxChip") as Dropdown;
  vscodeApi.postMessage({
    command: "dxChip",
    text: dxChipDropdown.value, 
  });
}

function handleDxPrintFChange(){
  const dxPrintFDropdown = document.getElementById("dxPrintF") as Dropdown;
  vscodeApi.postMessage({
    command: "dxPrintF",
    text: dxPrintFDropdown.value, 
  });
}

function handleDxMvioChange(){
  const dxMvioDropdown = document.getElementById("dxMvio") as Dropdown;
  vscodeApi.postMessage({
    command: "dxMvio",
    text: dxMvioDropdown.value, 
  });
}


