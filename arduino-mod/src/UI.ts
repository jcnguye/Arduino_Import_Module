import * as vscode from 'vscode';
import * as boardsInfo from "./boardsInfo";
import { UIItem } from "./UIItem";

export class UI implements vscode.TreeDataProvider<UIItem> {
    sketchFile: string = "";
    destinationDirectory: string = "";
    selectedBoard: string = "";

    getTreeItem(element: UIItem): vscode.TreeItem {
        return element;
    }
  
    getChildren(element?: UIItem): Thenable<UIItem[]> {
        if (element) {
            return Promise.resolve([]);
        } else {
            return Promise.resolve([
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
                new UIItem("Select Main Menu", vscode.TreeItemCollapsibleState.None, {
                    command: 'arduinoImportTree.mainMenu',
                    title: 'Arduino Main Menu'
                })
            ]);
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
            vscode.window.showInformationMessage(`Selected option: ${this.selectedBoard}`);
        }
    }
}

