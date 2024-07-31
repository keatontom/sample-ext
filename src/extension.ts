import axios from 'axios';
import * as vscode from 'vscode';
import { SidebarProvider } from './SidebarProvider';
import { exec }  from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';

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

// async function createGitLabRepo(projectName: string, privateToken: string) {
 

//     try {
//         const response = await axios.post(
//             'https://gitlab.tinaa.osc.tac.net/api/v4/projects',
//             {
//                 name: projectName,
// 				visibility: 'private',
// 				namespace_id: '2591'
//             },
//             {
//                 headers: {
//                     'Content-Type': 'application/json',
//                     'PRIVATE-TOKEN': privateToken,
// 				},
// 				httpsAgent: new https.Agent({
// 					ca: ca,
// 					rejectUnauthorized: false,
// 				}),
//             }
//         );

//         if (response.status === 201) {
//             vscode.window.showInformationMessage(`Repository ${projectName} created successfully!`);
//             return response.data;
//         } else {
//             vscode.window.showErrorMessage(`Failed to create repository: ${response.statusText}`);
//         }
//     } catch (error) {
// 		if (axios.isAxiosError(error)) { 
//             vscode.window.showErrorMessage(`Error: ${error.message}`);
//         } else if (error instanceof Error) {
//             vscode.window.showErrorMessage(`Error: ${error.message}`);
//         } else {
//             vscode.window.showErrorMessage(`Unknown error occurred`);
// 		}
// 	}
// }




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
	const filePath = path.join('yang_mod', fileName);
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
			exec(command, { cwd: 'yang_mod' }, (error, stdout, stderr) => {
				if (error) {
					vscode.window.showErrorMessage(`Error running pyang: ${error.message}`);
					return;
				}
				if (stderr) {
					vscode.window.showErrorMessage(`Error: ${stderr}`);
					return;
				} if (stdout === '') {
					vscode.window.showInformationMessage(`${fileName} validated successuflly.`);
				}
			});
		} else {
			if (await defaultYang(fileName) === 'Yes') {
				const command = `pyang ${fileName}`;
				exec(command, { cwd: 'yang_mod' }, (error, stdout, stderr) => {
					if (error) {
						vscode.window.showErrorMessage(`Error running pyang: ${error.message}`);
						return;
					}
					if (stderr) {
						vscode.window.showErrorMessage(`Error: ${stderr}`);
						return;
					} if (stdout === '') {
						vscode.window.showInformationMessage(`${fileName} validated successuflly.`);
					}
				});
			} 
		}
	});
}




// This method is called when your extension is deactivated
export function deactivate() {}