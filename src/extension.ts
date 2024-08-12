import axios from 'axios';
import * as vscode from 'vscode';
import { SidebarProvider } from './SidebarProvider';
import { exec }  from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import { validateNamingConventions } from './diagnostics';
import { validateYangFile } from './diagnostics';

// function validateNamingConventions(document: vscode.TextDocument, diagnostics: vscode.DiagnosticCollection) {
//     const text = document.getText();
//     const moduleRegex = /module\s+([\w-]+)\s*{/;
//     const namespaceRegex = /namespace\s+"([^"]+)";/;
//     const prefixRegex = /prefix\s+([\w-]+);/;

//     const moduleMatch = moduleRegex.exec(text);
//     const namespaceMatch = namespaceRegex.exec(text);
//     const prefixMatch = prefixRegex.exec(text);

//     let diagnosticList: vscode.Diagnostic[] = [];

//     if (moduleMatch) {
//         const moduleName = moduleMatch[1];
//         const moduleStart = moduleMatch.index + 7; // 'module ' length is 7
//         const moduleRange = new vscode.Range(document.positionAt(moduleStart), document.positionAt(moduleStart + moduleName.length));
//         if (!moduleName.startsWith('telus-')) {
//             diagnosticList.push(new vscode.Diagnostic(
//                 moduleRange,
//                 `Module name "${moduleName}" should start with "telus-"`,
//                 vscode.DiagnosticSeverity.Warning
//             ));
//         }
//     }

//     if (namespaceMatch) {
//         const namespace = namespaceMatch[1];
//         const namespaceStart = namespaceMatch.index + 11; // 'namespace "' length is 11
//         const namespaceRange = new vscode.Range(document.positionAt(namespaceStart), document.positionAt(namespaceStart + namespace.length));
//         if (!namespace.startsWith('https://tinaa.telus.com/')) {
//             diagnosticList.push(new vscode.Diagnostic(
//                 namespaceRange,
//                 `Namespace "${namespace}" should start with "https://tinaa.telus.com/"`,
//                 vscode.DiagnosticSeverity.Warning
//             ));
//         }
//     }

//     if (prefixMatch) {
//         const prefix = prefixMatch[1];
//         const prefixStart = prefixMatch.index + 7; // 'prefix ' length is 7
//         const prefixRange = new vscode.Range(document.positionAt(prefixStart), document.positionAt(prefixStart + prefix.length));
//         if (!prefix.startsWith('telus-')) {
//             diagnosticList.push(new vscode.Diagnostic(
//                 prefixRange,
//                 `Prefix "${prefix}" should start with "telus-"`,
//                 vscode.DiagnosticSeverity.Warning
//             ));
//         }
//     }

//     diagnostics.set(document.uri, diagnosticList);
// }


// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Naming Conventions
	const diagnostics = vscode.languages.createDiagnosticCollection('yang');
	context.subscriptions.push(diagnostics);

	context.subscriptions.push(
		vscode.workspace.onDidChangeTextDocument((event) => {
			const document = event.document;
			diagnostics.clear();
			if (document.languageId === 'yang') {
				validateNamingConventions(document, diagnostics);
			}
		})
	);
	context.subscriptions.push(
		vscode.workspace.onDidOpenTextDocument(document => {
			if (document.languageId === 'yang') {
				validateNamingConventions(document, diagnostics);
			}
		})
	);
	vscode.workspace.textDocuments.forEach((document) => {
		if (document.languageId === 'yang') {
			validateNamingConventions(document, diagnostics);
		}
	});
	context.subscriptions.push(
		vscode.workspace.onDidSaveTextDocument(document => {
			diagnostics.clear();
			if (document.languageId === 'yang') {
				validateNamingConventions(document, diagnostics);
			}
		})
	);


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

	context.subscriptions.push(
		vscode.commands.registerCommand('sample-ext.treeView', (fileName: string) => {
			if (fileName === '') {
				vscode.window.showWarningMessage('Warning: Please input a yang file');
				return;
			}
			const command = `pyang ${fileName} -f tree`;
			exec(command, { cwd: 'yang_mod' }, (error, stdout, stderr) => {
				if (error) {
					vscode.window.showErrorMessage(`Error running pyang: ${error.message}`);
					return;
				}
				if (stderr) {
					vscode.window.showErrorMessage(`Error: ${stderr}`);
					return;
				}
				if (sidebarProvider._view) {
					sidebarProvider._view.webview.postMessage({
						type: 'showTreeView',
						value: stdout
					});
				}
			});
		})
	);

	// Connect to GitLab
	context.subscriptions.push(
		vscode.commands.registerCommand('sample-ext.connectGitLab', async (gitLabUrl: string, privateToken: string, pathToCert: string) => {
			if (gitLabUrl === '' || privateToken === '' || pathToCert === '') {
				vscode.window.showErrorMessage('Warning: GitLab URL, Token, and Path to Certification are required.');
				return;
			}
			if (!fs.existsSync(pathToCert)) {
				vscode.window.showErrorMessage('CA cert not found');
				return;
			}
			const ca = fs.readFileSync(pathToCert);

			try {
				const response = await axios.get(gitLabUrl,
					{
						headers: {
							'PRIVATE-TOKEN': privateToken
						},
						httpsAgent: new https.Agent({
							ca: ca,
							rejectUnauthorized: false
						})
					}
				);
				if (response.status === 200) {
					vscode.window.showInformationMessage('Successfully connected to GitLab');
					if (sidebarProvider._view) {
						sidebarProvider._view.webview.postMessage({
							type: 'connectedToGitLab'
						});
					}
				}

			} catch (error) {
				if (axios.isAxiosError(error)) {
					vscode.window.showErrorMessage(`Error: ${error.message}`);
				} else if (error instanceof Error) {
					vscode.window.showErrorMessage(`Error: ${error.message}`);
				} else {
					vscode.window.showErrorMessage('Unknown error occurred');
				}
			}
		})
	);
	

	// Create GitLab Project
	context.subscriptions.push(
		vscode.commands.registerCommand('sample-ext.createGitLabRepo', async (projectName: string, groupId: string, gitLabUrl: string, privateToken: string, pathToCert: string) => {
			const ca = fs.readFileSync(pathToCert);
			if (projectName === '' || groupId === '') {
				vscode.window.showInformationMessage('Project Name and Group Id are required.');
				return;
			}

			try {
				const response = await axios.post(gitLabUrl,
					{
						name: projectName,
						visibility: 'private',
						namespace_id: groupId
					},
					{
						headers: {
							'Content-Type': 'application/json',
							'PRIVATE-TOKEN': privateToken,
						},
						httpsAgent: new https.Agent({
							ca: ca,
							rejectUnauthorized: false,
						}),
					}
				);

				if (response.status === 201) {
					vscode.window.showInformationMessage(`Repository ${projectName} created successfully!`);
					return response.data;
				} else {
					vscode.window.showErrorMessage(`Failed to create repository: ${response.statusText}`);
				}
			} catch (error) {
				if (axios.isAxiosError(error)) {
					vscode.window.showErrorMessage(`Error: ${error.message}`);
				} else if (error instanceof Error) {
					vscode.window.showErrorMessage(`Error: ${error.message}`);
				} else {
					vscode.window.showErrorMessage(`Unknown error occurred`);
				}
			}

		})
	);



}

// Fuction to call GitLab API
// glpat-Bxz9y-TGCk2aAGAPqXxt - https://gitlab.com/api/v4/projects
// aY_x1SxRm154wmsbhNmF - https://gitlab.tinaa.osc.tac.net/api/v4/projects
// local machine path: /usr/local/share/ca-certificates/TCSO-root-CA.crt


// This method is called when your extension is deactivated
export function deactivate() {}