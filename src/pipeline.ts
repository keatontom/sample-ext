import * as vscode from 'vscode';
import * as fs from 'fs';
import * as https from 'https';
import axios from 'axios';
import path from 'path';


export async function triggerPipeline(projectId: string, ref: string, triggerToken: string, privateToken: string, pathToCert: string) {
    const ca = fs.readFileSync(pathToCert);
    const url = `https://gitLab.tinaa.osc.tac.net/api/v4/projects/${projectId}/trigger/pipeline`;

    try {
        const response = await axios.post(url, {
            ref: ref, // Branch or tag name 
            token: triggerToken, // GitLab CI/CD trigger token 
        }, {
            headers: {
                'PRIVATE-TOKEN': privateToken,
            },
            httpAgent: new https.Agent({
                ca: ca,
                rejectUnauthorized: false,
            }),
        });
        if (response.status === 201 || response.status === 200) {
            vscode.window.showInformationMessage('Pipeline triggered successfully!');
            return response.data;
        } else {
            vscode.window.showInformationMessage(`Failed to trigger pipeline: ${response.statusText}`);
        }
    } catch (error) {
        if (axios.isAxiosError(error)) {
            vscode.window.showErrorMessage(`Error triggering pipeline: ${error.message}`);
        } else if (error instanceof Error) {
            vscode.window.showErrorMessage(`Error: ${error.message}`);
        } else {
            vscode.window.showErrorMessage('Unknown error occurred');
        }
    }
}