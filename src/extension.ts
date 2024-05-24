// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { HelloWorldPanel } from './HelloWorldPanel';
import { SidebarProvider } from './SidebarProvider';
import { exec } from 'child_process';
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Import API
	let testExtender = vscode.extensions.getExtension('keaton.test-extender');
	if (testExtender) {
		let importedApi = testExtender.exports;
		if (importedApi) {
			console.log('test-extender API loaded');
		}
	}

  // Message Pop-up 
  context.subscriptions.push(
    vscode.commands.registerCommand('sample-ext.helloWorld', () => {
      vscode.window.showInformationMessage('Hello World from sample-ext!');
    }));
	
	// Message Pop-up with buttons
  context.subscriptions.push(
    vscode.commands.registerCommand('sample-ext.askQuestion', async () => {
		const answer = await vscode.window.showInformationMessage('How is your day?', 'Good', 'Bad');
		if (answer === 'Bad') {
			vscode.window.showInformationMessage("Sorry to hear that");
		} 
		console.log({ answer });
	}));
	
	// Webview
	context.subscriptions.push(
		vscode.commands.registerCommand('sample-ext.openWebview', () => {
			HelloWorldPanel.createOrShow(context.extensionUri);
		}));

	//Sidebar
	const sidebarProvider = new SidebarProvider(context.extensionUri);
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider("sample-ext-sidebar", sidebarProvider));
	
	// Terminal Commands
	context.subscriptions.push(
		vscode.commands.registerCommand('sample-ext.cdpyang', () => {
			const folderPath = './pyang';
			const command1 = `cd ${folderPath} && pwd`;
			exec(command1, (error, stdout, stderr) => {
				if (error) {
					vscode.window.showErrorMessage(`Error: ${error.message}`);
					return;
				}
				if (stderr) {
					vscode.window.showWarningMessage(`Stderr: ${stderr}`);
					return;
				}
				vscode.window.showInformationMessage(`Output: ${stdout}`);
			});
		}));
	
	context.subscriptions.push(
		vscode.commands.registerCommand('sample-ext.runCommand', () => {
			const folderPath = './pyang';
			const terminal = vscode.window.createTerminal("Pyang Terminal");
	
			// Switch to the specified directory and run commands
			terminal.sendText(`cd ${folderPath}`);
			terminal.sendText('pwd');  // Display current directory
			// Add any additional commands you want to run in the same terminal session
			terminal.sendText('pyang hello.yang');   // List files in the directory
	
			// Show the terminal
			terminal.show();
		})
	);
	
	console.log(vscode.extensions.all);

}

// This method is called when your extension is deactivated
export function deactivate() {}
