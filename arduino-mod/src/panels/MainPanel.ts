import { Disposable, Webview, WebviewPanel, window, Uri, ViewColumn } from "vscode";
import { getUri } from "../utilities/getUri";
import { getNonce } from "../utilities/getNonce";
import * as ex from "../extension";

export class MainPanel {
  public static currentPanel: MainPanel | undefined;
  private readonly _panel: WebviewPanel;
  private _disposables: Disposable[] = [];

  private sketchFile: string = "";
  private destinationDirectory: string = "";
  private selectedBoard: string = "";
  private boardOptions: string[] = [];
  private selectedOption: string = "";
  private readyForImport: boolean = false;

  /**
   * The MainPanel class private constructor (called only from the render method).
   *
   * @param panel A reference to the webview panel
   * @param extensionUri The URI of the directory containing the extension
   */
  private constructor(panel: WebviewPanel, extensionUri: Uri) {
    this._panel = panel;

    // Set an event listener to listen for when the panel is disposed (i.e. when the user closes
    // the panel or when the panel is closed programmatically)
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    // Set the HTML content for the webview panel
    this._panel.webview.html = this._getWebviewContent(this._panel.webview, extensionUri);

    // Set an event listener to listen for messages passed from the webview context
    this._setWebviewMessageListener(this._panel.webview);
  }

  /**
   * Renders the current webview panel if it exists otherwise a new webview panel
   * will be created and displayed.
   *
   * @param extensionUri The URI of the directory containing the extension.
   */
  public static render(extensionUri: Uri) {
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
  private _getWebviewContent(webview: Webview, extensionUri: Uri) {
    const webviewUri = getUri(webview, extensionUri, ["out", "webview.js"]);
    const nonce = getNonce();
    const importContent = this.getImportContent();

    // Tip: Install the es6-string-html VS Code extension to enable code highlighting below
    //test
    return /*html*/ `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
					<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'nonce-${nonce}';">
          <title>Arduino Import Module</title>
        </head>
        <body>
          <h1>Arduino Import Module</h1>
          <section class="component-row">
            <vscode-button id="sketchFile">Select Arduino Sketch</vscode-button>
          </section>
          <br>
          <section class="component-row">
            <vscode-button id="destDir">Select Destination Directory</vscode-button>
          </section>
          <br> 
          <vscode-dropdown id="board">
            <vscode-option value="">Select Arduino Board</vscode-option>
            <vscode-option value="UNO">Uno</vscode-option>
            <vscode-option value="NANO">Nano</vscode-option>
            <vscode-option value="MEGA">Mega or Mega2560</vscode-option>
            <vscode-option value="PRO">Pro or Pro Mini</vscode-option>
          </vscode-dropdown>
          <br>
          <br>
          ${importContent}
					<script type="module" nonce="${nonce}" src="${webviewUri}"></script>
        </body>
      </html>
    `;
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
            window.showInformationMessage(`Selected board: ${this.selectedBoard}`);
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
              window.showInformationMessage(`Selected file: ${this.destinationDirectory}`);
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
              window.showInformationMessage(`Selected file: ${this.sketchFile}`);
              this.allSelectionsMade();
            }
          
          // Add more switch case statements here as more webview message commands
          // are created within the webview context (i.e. inside src/webview/main.ts)
        }
      },
      undefined,
      this._disposables
    );
  }

  private getImportContent() {
    if (this.readyForImport){
      return '<vscode-button id="import">Import</vscode-button>';
    } else {
      return '<vscode-button disabled id="import">Import</vscode-button>';
    }
  }

  private allSelectionsMade() {
    if (this.sketchFile.length > 0 && this.destinationDirectory.length > 0 && this.selectedBoard.length > 0 && this.selectedOption.length > 0) {
      this.readyForImport = true;
        //ex.startImport(this.sketchFile, this.destinationDirectory, this.selectedBoard, this.selectedOption);
    }
}
}
