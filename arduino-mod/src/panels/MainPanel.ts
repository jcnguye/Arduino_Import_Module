import { Disposable, Webview, WebviewPanel, window, Uri, ViewColumn } from "vscode";
import { getUri } from "../utilities/getUri";
import { getNonce } from "../utilities/getNonce";
import * as ex from "../extension";
import * as boardsInfo from "../board";
import { Board } from "../board";

export class MainPanel {
  public static currentPanel: MainPanel | undefined;
  private readonly _panel: WebviewPanel;
  private _disposables: Disposable[] = [];
  private extensionUri: Uri;

  private sketchFile: string = "";
  private destinationDirectory: string = "";
  private selectedBoard: string = "";
  private selectedOption: string = "";

  private readyForImport: boolean = false;
  private debuggingOptimization = false; 

  /**
   * The MainPanel class private constructor (called only from the render method).
   *
   * @param panel A reference to the webview panel
   * @param extensionUri The URI of the directory containing the extension
   */
  private constructor(panel: WebviewPanel, extensionUri: Uri) {
    this._panel = panel;
    this.extensionUri = extensionUri;

    // Set an event listener to listen for when the panel is disposed (i.e. when the user closes
    // the panel or when the panel is closed programmatically)
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    // Set the HTML content for the webview panel
    this._panel.webview.html = this._getWebviewContent(this._panel.webview);

    // Set an event listener to listen for messages passed from the webview context
    this._setWebviewMessageListener(this._panel.webview);
  }

  /**
   * Renders the current webview panel if it exists otherwise a new webview panel
   * will be created and displayed.
   *
   * @param extensionUri The URI of the directory containing the extension.
   */
  public static render(extensionUri: Uri): MainPanel {
    if (MainPanel.currentPanel) {
      // If the webview panel already exists reveal it
      MainPanel.currentPanel._panel.reveal(ViewColumn.One);
    } else {
      // If a webview panel does not already exist create and show a new one
      const panel = window.createWebviewPanel(
        // Panel view type
        "mainPanel",
        // Panel title
        "Arduino Import Module",
        // The editor column the panel should be displayed in
        ViewColumn.One,
        // Extra panel configurations
        {
          // Enable JavaScript in the webview
          enableScripts: true,
          // Restrict the webview to only load resources from the `out` directory
          //localResourceRoots: [Uri.joinPath(extensionUri, "out")],
          enableCommandUris: true,
        }
      );

      MainPanel.currentPanel = new MainPanel(panel, extensionUri);
    }

    return MainPanel.currentPanel;
  }

  /**
   * Cleans up and disposes of webview resources when the webview panel is closed.
   */
  public dispose() {
    MainPanel.currentPanel = undefined;

    // Dispose of the current webview panel
    this._panel.dispose();

    // Dispose of all disposables (i.e. commands) associated with the current webview panel
    while (this._disposables.length) {
      const disposable = this._disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }
  }

  private refresh() {
    this._panel.webview.html = this._getWebviewContent(this._panel.webview);
  }

  /**
   * Defines and returns the HTML that should be rendered within the webview panel.
   *
   * @remarks This is also the place where *references* to CSS and JavaScript files
   * are created and inserted into the webview HTML.
   *
   * @param webview A reference to the extension webview
   * @param extensionUri The URI of the directory containing the extension
   * @returns A template string literal containing the HTML that should be
   * rendered within the webview panel
   */
  private _getWebviewContent(webview: Webview) {
    const webviewUri = getUri(webview, this.extensionUri, ["out", "webview.js"]);
    const stylesUri = getUri(webview, this.extensionUri, ["out", "styles.css"]);
    const nonce = getNonce();
    const fileContent = this.getFileContent();
    const dirContent = this.getDirContent();
    const boardContent = this.getBoardContent();
    const boardOptionsContent = this.getBoardOptionsContent();
    const importContent = this.getImportContent();

    // Tip: Install the es6-string-html VS Code extension to enable code highlighting below
    //test
    return /*html*/ `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
					<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
          <title>Arduino Import Module</title>
        </head>
        <body>
          <h1>Arduino Import Module</h1>
          <section class="component-row">
            <vscode-button id="sketchFile">Select Arduino Sketch</vscode-button>
            ${fileContent}   
          </section>
          <br>
          <section>
            <vscode-button id="destDir">Select Destination Directory</vscode-button>
            ${dirContent}
          </section>
          <p>Select Arduino Board</p> 
          <vscode-dropdown id="board">
            ${boardContent}
          </vscode-dropdown>
          <br>
          <br>
          ${boardOptionsContent}
          <vscode-radio-group id="optimizeOpt" orientation="vertical"><label slot="label">Select Optimization Option</label>
            <vscode-radio default value="codeSizeOptimization">Optimize for code size (default)</vscode-radio>
            <vscode-radio value="debuggingOptimization">Optimize for debugging</vscode-radio>
          </vscode-radio-group>
          <br>
          ${importContent}
					<script type="module" nonce="${nonce}" src="${webviewUri}"></script>
        </body>
      </html>
    `;
  }

  private getFileContent(){	
    let result = '';	
    if (this.sketchFile.length > 0) {	
      result = `<p>Selected sketch file: ${this.sketchFile} </p>`;	
    }	
    return result;	
  }	

  private getDirContent(){	
    let result = '';	
    if (this.destinationDirectory.length > 0) {	
      result = `<p>Selected directory: ${this.destinationDirectory} </p>`;	
    }	
    return result;	
  }

  private getBoardContent(){
    let result = `<vscode-option value="${this.selectedBoard}">${this.selectedBoard}</vscode-option>`;
    for (const board of boardsInfo.getAllBoards()) {
      if (board !== this.selectedBoard){
        result = result + `<vscode-option value="${board}">${board}</vscode-option>`;
      }
    }
    return result;
  }

  private getBoardOptionsContent(){
    let result = '';
    if (this.selectedBoard.length > 0) {
      const options = boardsInfo.getBoardOptions(this.selectedBoard);

      if (options.length > 0 ) {
        result = `<vscode-radio-group id="boardOpt" orientation="vertical"><label slot="label">Select Chip Category</label>`;
        for (const opt of options) {
          result = result + `<vscode-radio value="${opt}">${opt}</vscode-radio>`;
        }
        result = result + `</vscode-radio-group>`;
      }
    }
    return result;
  }

  private getChipOptionsContent(){
    let result = '';
    if (this.selectedOption.length > 0) {
      const chips = boardsInfo.getDxCoreChipOptions(this.selectedOption);

      if (chips.length > 0 ) {
        result = `<vscode-radio-group id="chips" orientation="vertical"><label slot="label">Chips</label>`;
        for (const chip of chips) {
          result = result + `<vscode-radio value="${chip}">${chip}</vscode-radio>`;
        }
        result = result + `</vscode-radio-group>`;
      }
    }
    return result;
  }

  private getImportContent(){
    if (this.readyForImport) {
      return '<vscode-button id="import">Import</vscode-button>';
    }
    return '<vscode-button disabled id="import">Import</vscode-button>';  
  }

  /**
   * Sets up an event listener to listen for messages passed from the webview context and
   * executes code based on the message that is recieved.
   *
   * @param webview A reference to the extension webview
   */
  private _setWebviewMessageListener(webview: Webview) {
    webview.onDidReceiveMessage(
      async (message: any) => {
        const command = message.command;
        const text = message.text;

        switch (command) {
          case "board":
            this.selectedBoard = text;
            this.allSelectionsMade();
            this.refresh();
            return;
          case "boardOpt":
            this.selectedOption = text;
            return;
          case "optimizeOpt":
            if (text === "debuggingOptimization") {
              this.debuggingOptimization = true;
            }
            return;  
          case "directory":
            const destDir = await window.showOpenDialog({
              canSelectFiles: false,
              canSelectFolders: true,
              canSelectMany: false,
              openLabel: 'Select Destination Directory',
            });
            
            if (destDir && destDir[0]) {
              this.destinationDirectory = destDir[0].fsPath;
              webview.postMessage({
                command: "dirPath",
                message: this.destinationDirectory,
              });
              this.allSelectionsMade();
              this.refresh();
            }
            return;
          case "sketch":
            const sketchFile = await window.showOpenDialog({
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
              webview.postMessage({
                command: "sketchPath",
                message: this.sketchFile,
              });
              this.allSelectionsMade();
              this.refresh();
            }
            return;
          case "import":
            const board = new Board(this.selectedBoard);
            ex.startImport(this.sketchFile, this.destinationDirectory, board, this.debuggingOptimization);
        }
      },
      undefined,
      this._disposables
    );
  }

  private allSelectionsMade() {
    if (this.sketchFile.length > 0 && this.destinationDirectory.length > 0 && this.selectedBoard.length > 0) {
      this.readyForImport = true;
      this.refresh();
    }
  }

}
