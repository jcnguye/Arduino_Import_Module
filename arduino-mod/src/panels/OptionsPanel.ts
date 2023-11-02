import { Disposable, Webview, WebviewPanel, window, Uri, ViewColumn } from "vscode";
import { getUri } from "../utilities/getUri";
import { getNonce } from "../utilities/getNonce";
import * as boardsInfo from "../boardsInfo";

export class OptionsPanel {
  public static currentPanel: OptionsPanel | undefined;
  private readonly _panel: WebviewPanel;
  private _disposables: Disposable[] = [];
  private extensionUri: Uri;

  private selectedBoard: string = "";

  /**
   * Private constructor (called only from the render method).
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
  public static render(extensionUri: Uri) {
    if (OptionsPanel.currentPanel) {
      // If the webview panel already exists reveal it
      OptionsPanel.currentPanel._panel.reveal(ViewColumn.One);
    } else {
      // If a webview panel does not already exist create and show a new one
      const panel = window.createWebviewPanel(
        // Panel view type
        "optionsPanel",
        // Panel title
        "Board Options",
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

      OptionsPanel.currentPanel = new OptionsPanel(panel, extensionUri);
    }
  }

  /**
   * Cleans up and disposes of webview resources when the webview panel is closed.
   */
  public dispose() {
    OptionsPanel.currentPanel = undefined;

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
    const boardOptionsContent = this.getBoardOptionsContent();

    return /*html*/ `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
					<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
          <link rel="stylesheet" href="${stylesUri}">
          <title>Arduino Import Module</title>
        </head>
        <body>
          <section id="options">
            <p>Board Options</p>
            ${boardOptionsContent}
          </section>
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
            //this.refresh();
            return;
        }
      },
      undefined,
      this._disposables
    );
  }

  private getBoardOptionsContent(){
    let result = '';
    if (this.selectedBoard.length > 0) {
      const boardOptions = boardsInfo.getBoardOptions(this.selectedBoard);
      if (boardOptions.length > 0 ) {
        result = `<vscode-radio-group id="boardOpt" orientation="vertical"><label slot="label">Select Board Option</label>`;
        for (const opt of boardOptions) {
          result = result + `<vscode-radio value="${opt}">${opt}</vscode-radio>`;
        }
        result = result + `</vscode-radio-group>`;
      }
    }
    return result;
  }


}
