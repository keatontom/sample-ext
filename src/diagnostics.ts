import * as vscode from 'vscode';
import axios from 'axios';
import { exec }  from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';

export function validateNamingConventions(document: vscode.TextDocument, diagnostics: vscode.DiagnosticCollection) {
        const text = document.getText();
        const moduleRegex = /module\s+([\w-]+)\s*{/;
        const namespaceRegex = /namespace\s+"([^"]+)";/;
        const prefixRegex = /prefix\s+([\w-]+);/;
    
        const moduleMatch = moduleRegex.exec(text);
        const namespaceMatch = namespaceRegex.exec(text);
        const prefixMatch = prefixRegex.exec(text);
    
        let diagnosticList: vscode.Diagnostic[] = [];
    
        if (moduleMatch) {
            const moduleName = moduleMatch[1];
            const moduleStart = moduleMatch.index + 7; // 'module ' length is 7
            const moduleRange = new vscode.Range(document.positionAt(moduleStart), document.positionAt(moduleStart + moduleName.length));
            if (!moduleName.startsWith('telus-')) {
                diagnosticList.push(new vscode.Diagnostic(
                    moduleRange,
                    `Module name "${moduleName}" should start with "telus-"`,
                    vscode.DiagnosticSeverity.Warning
                ));
            }
        }
    
        if (namespaceMatch) {
            const namespace = namespaceMatch[1];
            const namespaceStart = namespaceMatch.index + 11; // 'namespace "' length is 11
            const namespaceRange = new vscode.Range(document.positionAt(namespaceStart), document.positionAt(namespaceStart + namespace.length));
            if (!namespace.startsWith('https://tinaa.telus.com/')) {
                diagnosticList.push(new vscode.Diagnostic(
                    namespaceRange,
                    `Namespace "${namespace}" should start with "https://tinaa.telus.com/"`,
                    vscode.DiagnosticSeverity.Warning
                ));
            }
        }
    
        if (prefixMatch) {
            const prefix = prefixMatch[1];
            const prefixStart = prefixMatch.index + 7; // 'prefix ' length is 7
            const prefixRange = new vscode.Range(document.positionAt(prefixStart), document.positionAt(prefixStart + prefix.length));
            if (!prefix.startsWith('telus-')) {
                diagnosticList.push(new vscode.Diagnostic(
                    prefixRange,
                    `Prefix "${prefix}" should start with "telus-"`,
                    vscode.DiagnosticSeverity.Warning
                ));
            }
        }
    
        diagnostics.set(document.uri, diagnosticList);
}

// Function to ask to proceed with defaulted YANG verison 
export async function defaultYang(fileName: string) {
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
export function validateYangFile(fileName: string, expectedVersion: string) {
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