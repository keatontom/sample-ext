import * as vscode from "vscode";
import { getNonce } from "./getNonce";
import path from "path";

export class SidebarProvider implements vscode.WebviewViewProvider {
  _view?: vscode.WebviewView;
  _doc?: vscode.TextDocument;
  private viewReady: Promise<void>;
  private resolveViewReady!: () => void;

  constructor(private readonly _extensionUri: vscode.Uri) {
    this.viewReady = new Promise((resolve) => {
      this.resolveViewReady = resolve;
    });
  }

  public resolveWebviewView(webviewView: vscode.WebviewView) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this._extensionUri, 'media'),
        vscode.Uri.joinPath(this._extensionUri, 'out', 'compiled')
      ],
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    webviewView.webview.onDidReceiveMessage(async (data) => {
      switch (data.type) {
        case "onInfo": {
          if (!data.value) {
            return;
          }
          vscode.window.showInformationMessage(data.value);
          break;
        }
        case "onError": {
          if (!data.value) {
            return;
          }
          vscode.window.showErrorMessage(data.value);
          break;
        }
        case "validatePyang10": {
          vscode.commands.executeCommand('sample-ext.validate-1.0', data.value);
          break;
        }
        case "validatePyang11": {
          vscode.commands.executeCommand('sample-ext.validate-1.1', data.value);
          break;
        }
        case "tree": {
          vscode.commands.executeCommand('sample-ext.treeView', data.value);
          break;
        }
        case "connectToGitLab": {
          const { gitLabUrl, privateToken, pathToCert } = data.value;
          vscode.commands.executeCommand('sample-ext.connectGitLab', gitLabUrl, privateToken, pathToCert);
          break;
        }
        case "createGitLabRepo": {
          const { projectName, groupId, gitLabUrl, privateToken, pathToCert } = data.value;
          vscode.commands.executeCommand('sample-ext.createGitLabRepo', projectName, groupId, gitLabUrl, privateToken, pathToCert);
          break;
        }
        case "triggerPipeline": {
          const { projectId, ref, triggerToken, privateToken, pathToCert } = data.valiue;
          vscode.commands.executeCommand('sample-ext.triggerPipeline', projectId, ref, triggerToken, privateToken, pathToCert);
          break;
        }
      }
    });

    this.resolveViewReady();
  }

  public async ensureViewReady() {
    await this.viewReady;
  }

  public revive(panel: vscode.WebviewView) {
    this._view = panel;
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    const styleResetUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "reset.css")
    );
    const styleVSCodeUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "vscode.css")
    );

    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "out", "compiled/sidebar.js")
    );
    const styleMainUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "out", "compiled/sidebar.css")
    );

    const nonce = getNonce();

    return `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta http-equiv="Content-Security-Policy" content="img-src https: data:; style-src 'unsafe-inline' ${
          webview.cspSource
        }; script-src 'nonce-${nonce}';">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="${styleResetUri}" rel="stylesheet">
        <link href="${styleVSCodeUri}" rel="stylesheet">
        <link href="${styleMainUri}" rel="stylesheet">
        <script nonce="${nonce}"></script>
      </head>
      <body>
        <script nonce="${nonce}" src="${scriptUri}"></script>
      </body>
      </html>`;
  }
}
