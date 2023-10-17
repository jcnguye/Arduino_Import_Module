import * as vscode from 'vscode';
import * as boardsInfo from "./boardsInfo";
import { UIItem } from "./UIItem";

export class UI implements vscode.TreeDataProvider<UIItem> {
    private sketchFile: string = "";
    private destinationDirectory: string = "";
    private selectedBoard: string = "";
    private boardOptions: string[] = [];
    private selectedOption: string = "";

    private uiItems: UIItem[] = [
        new UIItem("Select Arduino Sketch File", vscode.TreeItemCollapsibleState.None, {
            command: 'arduinoImportTree.selectSketchFile',
            title: 'Select Arduino Sketch File'
        }),
        new UIItem("Select Destination Directory", vscode.TreeItemCollapsibleState.None, {
            command: 'arduinoImportTree.selectDestinationDirectory',
            title: 'Select Destination Directory'
        }),
        new UIItem("Select Arduino Board", vscode.TreeItemCollapsibleState.None, {
            command: 'arduinoImportTree.selectBoard',
            title: 'Select Arduino Board'
        }),
        new UIItem("Select Board Options", vscode.TreeItemCollapsibleState.None, {
            command: 'arduinoImportTree.selectBoardOpt',
            title: 'Select Board Options'
        }),
    ];

    getSketchFile() {
        return this.sketchFile;
    }

    getDestinationDirectory(){
        return this.destinationDirectory;
    }

    getSelectedBoard(){
        return this.selectBoard;
    }

    getSelectedOption(){
        return this.selectedOption;
    }

    getTreeItem(element: UIItem): vscode.TreeItem {
        return element;
    }
  
    getChildren(element?: UIItem): Thenable<UIItem[]> {
        if (element) {
            return Promise.resolve([]);
        } else {
            return Promise.resolve(this.uiItems);
        }
    } 
    
    async selectSketchFile() {
        const sketchFile = await vscode.window.showOpenDialog({
            canSelectFiles: true,
            canSelectFolders: false,
            canSelectMany: false,
            filters: {
                'arduinoSketch': ['ino']
            },
            openLabel: 'Select Arduino Sketch File',
        });
      
        if (sketchFile && sketchFile[0]) {
            this.sketchFile = sketchFile[0].fsPath;
            vscode.window.showInformationMessage(`Selected file: ${this.sketchFile}`);
        }
      }
      
    async selectDestinationDirectory() {
        const destDir = await vscode.window.showOpenDialog({
            canSelectFiles: false,
            canSelectFolders: true,
            canSelectMany: false,
            openLabel: 'Select Destination Directory',
        });
          
        if (destDir && destDir[0]) {
            this.destinationDirectory = destDir[0].fsPath;
            vscode.window.showInformationMessage(`Selected file: ${this.destinationDirectory}`);
        }
    }
      
    async selectBoard() {
        const board = await vscode.window.showQuickPick([
            boardsInfo.UNO, boardsInfo.NANO, boardsInfo.MEGA, boardsInfo.PRO
        ], {
            placeHolder: "Select Arduino Board",
        });
      
        if (board) {
            this.selectedBoard = board; 
            this.boardOptions = boardsInfo.getBoardOptions(this.selectedBoard);
            vscode.window.showInformationMessage(`Selected board: ${this.selectedBoard}`);
        }
    }

    async selectBoardOpt() {
        if (this.selectedBoard === "") {
            vscode.window.showInformationMessage("Please select a board first.");
        } else {
            if (this.boardOptions.length === 0) {
                vscode.window.showInformationMessage("There are no supported options for the selected board.");
            } else {
                let opt = await vscode.window.showQuickPick(this.boardOptions);
                if (opt) {
                    this.selectedOption = opt; 
                    vscode.window.showInformationMessage(`Selected option: ${this.selectedOption}`);
                }
            } 
        }
    }
}

