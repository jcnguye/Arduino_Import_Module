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

  //DxCore options
  private dxChip: string = "";
  private dxPrintF: string = "default";
  private dxMvio: string = "";

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
    const dxCoreOptionsContent = this.getDxCoreOptionsContent();
    const importContent = this.getImportContent();

    // Tip: Install the es6-string-html VS Code extension to enable code highlighting below
    //test
    return /*html*/ `
      <!DOCTYPE html>
      <html lang="en">
      <style>
      .container {
          display: grid;
          grid-template-columns: repeat(3, 1fr); /* Three equal-width columns */
          gap: 20px; /* Spacing between columns */
      }
      .column {
          padding: 20px;
          border: 1px solid #ccc;
          border-radius: 5px;
      }
      .bottom-right {
        position: fixed;
        bottom: 0;
        right: 0;
        padding: 30px;
      }
      .radio-group {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
    }
      .radio-group label {
        margin-bottom: 5px;
      }
      </style>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
					<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
          <title>Arduino Import Module</title>
        </head>
        <body>
          <h1>Arduino Import Module</h1>
          <div class="container">
            <div class="column">
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
          
              <vscode-radio-group id="optimizeOpt" orientation="vertical"><label slot="label">Select Optimization Option</label>
                <vscode-radio default value="codeSizeOptimization">Optimize for code size (default)</vscode-radio>
                <vscode-radio value="debuggingOptimization">Optimize for debugging</vscode-radio>
              </vscode-radio-group>
              <br>
            </div>
            ${dxCoreOptionsContent}
          </div>
          <div class="bottom-right">
            ${importContent}
          </div>
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

  private getDxCoreOptionsContent(){
    let result = '';
    const mvio = this.getDxMvioContent();
    if (this.selectedBoard === boardsInfo.DXCORE) {
      const chipArray: string[] = ['AVR128DA28', 'AVR128DA32', 'AVR128DA48', 'AVR128DA64', 'AVR64DA28', 'AVR64DA32', 
        'AVR64DA48', 'AVR64DA64', 'AVR32DA28', 'AVR32DA32', 'AVR32DA48', 'AVR128DB28', 'AVR128DB32', 
        'AVR128DB48', 'AVR128DB64','AVR64DB28', 'AVR64DB32', 'AVR64DB48', 'AVR64DB64', 'AVR32DB28', 
        'AVR32DB32', 'AVR32DB48', 'AVR64DD14', 'AVR64DD20', 'AVR64DD28', 'AVR64DD32','AVR32DD14', 'AVR32DD20', 
        'AVR32DD28', 'AVR32DD32','AVR16DD14', 'AVR16DD20', 'AVR16DD28', 'AVR16DD32', 'AVR64EA28', 'AVR64EA32', 
        'AVR64EA48', 'AVR32EA28', 'AVR32EA32', 'AVR32EA48', 
        'AVR16EA28', 'AVR16EA32', 'AVR16EA48'];
      let chipOptions = `<vscode-option value="${this.dxChip}">${this.dxChip}</vscode-option>`;
      for (const chip of chipArray) {
        if (chip !== this.dxChip){
          chipOptions = chipOptions + `<vscode-option value="${chip}">${chip}</vscode-option>`;
        }
      }
      result = ` 
      <div class="column">
        <p>Select Chip</p> 
        <vscode-dropdown id="dxChip">
          ${chipOptions}
        </vscode-dropdown>
        <p>Select printf() option</p> 
        <vscode-dropdown id="dxPrintF">
          <vscode-option value="default">printf() - default</vscode-option>
          <vscode-option value="full">printf() - full</vscode-option>
          <vscode-option value="minimal">printf() - minimal</vscode-option>
        </vscode-dropdown>
        ${mvio}
      </div>
      `; 
    }
    return result;
  }

  private getDxMvioContent() {
    let result = '';
    if (this.dxChip.includes("DB" || this.dxChip.includes("DD"))){
      result = `
      <p>MVIO</p> 
      <vscode-dropdown id="dxMvio">
        <vscode-option value=""></vscode-option>
        <vscode-option value="Enabled">Enabled</vscode-option>
        <vscode-option value="Disabled">Disabled</vscode-option>
      </vscode-dropdown>
      `; 
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
          case "dxChip":
            this.dxChip = text;
            this.allSelectionsMade();
            this.refresh();
            return;
          case "dxPrintF":
            this.dxPrintF = text;
            return;
          case "dxMvio":
            this.dxMvio = text;
            return;
          case "import":
            const board = new Board(this.selectedBoard);
            if (this.selectedBoard === boardsInfo.DXCORE) {
              ex.startImport(this.sketchFile, this.destinationDirectory, board, this.debuggingOptimization, this.dxChip, this.dxPrintF, this.dxMvio);
            } else {
              ex.startImport(this.sketchFile, this.destinationDirectory, board, this.debuggingOptimization);
            }
        }
      },
      undefined,
      this._disposables
    );
  }

  private allSelectionsMade() {
    if (this.sketchFile.length > 0 && this.destinationDirectory.length > 0 && this.selectedBoard.length > 0) {
      if (this.selectedBoard === boardsInfo.DXCORE) {
        if (this.dxChip.length > 0) {
          this.readyForImport = true;
        }
      } else {
        this.readyForImport = true;
      }
      this.refresh();
    }
  }

}
