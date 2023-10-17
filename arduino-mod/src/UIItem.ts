import * as vscode from 'vscode';

export class UIItem extends vscode.TreeItem {
    constructor(
        label: string,
        collapsibleState: vscode.TreeItemCollapsibleState,
        command?: vscode.Command
    ) 
    {
        super(label, collapsibleState);
        if (command) {
            this.command = command;
        }
    }
}