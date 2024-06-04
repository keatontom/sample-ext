// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { HelloWorldPanel } from './HelloWorldPanel';
import { SidebarProvider } from './SidebarProvider';
import { exec }  from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

// let pyangTerminal: vscode.Terminal | undefined;

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

	// Sidebar
	const sidebarProvider = new SidebarProvider(context.extensionUri);
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider("sample-ext-sidebar", sidebarProvider));

	// Invoked Pyang Commands
	context.subscriptions.push(
		vscode.commands.registerCommand('sample-ext.validate-1.0', (fileName: string) => {
			if (fileName === '') {
				vscode.window.showWarningMessage('Warning: Please input a yang file');
				return;
			}
			validateYangFile(fileName, '1.0');
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('sample-ext.validate-1.1', (fileName: string) => {
			if (fileName === '') {
				vscode.window.showWarningMessage('Warning: Please input a yang file');
				return;
			}
			validateYangFile(fileName, '1.1');
		})
	);
}

// Function to ask to proceed with defaulted YANG verison 
async function defaultYang(fileName: string) {
	const answer = await vscode.window.showInformationMessage(`The version specified in ${fileName} does not match. 
	Would you like to proceed with defaulted version YANG 1.0?`, 'Yes', 'No');
	if (answer === 'Yes') {
		return answer;
	} else {
		vscode.window.showInformationMessage(`Please specify what YANG version you would like to use in ${fileName}`);
		return answer;
	}
}

// Function to send error messages for incorrect YANG version 
function validateYangFile(fileName: string, expectedVersion: string) {
	const filePath = path.join('pyang', fileName);
	fs.readFile(filePath, 'utf8', async (err, data) => {
		if (err) {
			vscode.window.showErrorMessage(`${err.message}`);
			return;
		}

		const versionMatch = data.match(/yang-version\s+(\d+\.\d+);/);
		let version: string;
		let message: string;

		if (versionMatch) {
			version = versionMatch[1];
			message = `YANG version ${version} found in the file.`;
			
		} else {
			version = '1.0';
			message = `YANG version not specified in the file. Defaulting to YANG version ${version}.`;
		}


		if (version === expectedVersion) {
			const command = `pyang ${fileName}`;
			exec(command, { cwd: 'pyang' }, (error, stdout, stderr) => {
				if (error) {
					vscode.window.showErrorMessage(`Error running pyang: ${error.message}`);
					return;
				}
				if (stderr) {
					vscode.window.showErrorMessage(`Error: ${stderr}`);
					return;
				}
				vscode.window.showInformationMessage(`${fileName} validated successuflly.`);
			});
		} else {
			if (await defaultYang(fileName) === 'Yes') {
				const command = `pyang ${fileName}`;
				exec(command, { cwd: 'pyang' }, (error, stdout, stderr) => {
					if (error) {
						vscode.window.showErrorMessage(`Error running pyang: ${error.message}`);
						return;
					}
					if (stderr) {
						vscode.window.showErrorMessage(`Error: ${stderr}`);
						return;
					}
					vscode.window.showInformationMessage(`${fileName} validated successuflly.`);
				});
			} 
		}
	});
}




// This method is called when your extension is deactivated
export function deactivate() {}