import * as vscode from 'vscode';
import * as fs from 'fs';
import * as https from 'https';
import axios, { post } from 'axios';
import FormData from 'form-data'; // Import FormData
import path from 'path';

export async function triggerPipeline(
    // Pre-filled data values from connecting to GitLab
    privateToken: string, 
    pathToCert: string,

    // Data values for pipeline trigger
    triggerToken: string, 
    ref: string, 

    commitId: string,
    entityName: string,
    modelCommitId: string,
    modelFilename: string,
    modelName: string,
    modelUrl: string,
    url: string
) {
    const ca = fs.readFileSync(pathToCert);
    const pipeurl = `https://gitlab.tinaa.osc.tac.net/api/v4/projects/720/trigger/pipeline`;

    // Create a FormData object to include all the parameters
    const postdata = {
        token: triggerToken,
        ref: ref,
        'variables[COMMIT_ID]': commitId,
        'variables[ENTITY_NAME]': entityName,
        'variables[MODEL_COMMIT_ID]': modelCommitId,
        'variables[MODEL_FILENAME]': modelFilename,
        'variables[MODEL_NAME]': modelName,
        'variables[MODEL_URL]': modelUrl,
        'variables[URL]': url,
    };

    try {
        const response = await axios.post(pipeurl, postdata, {
            headers: {
                'PRIVATE-TOKEN': privateToken,
            },
            httpsAgent: new https.Agent({
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

// glptt-4a24e6016284ec9615c9facb85b70ab8f0649c10 - vscode trigger token

// curl -X POST \
//      --fail \
//      -F token=glptt-83256e3b06e3266af36357ce689a8af3ed789c31 \
//      -F "ref=master" \
//      -F "variables[COMMIT_ID]=4d45bc1ee66bbf5667f43cedf7a6f02593bba663" \
//      -F "variables[ENTITY_NAME]=arp" \
//      -F "variables[MODEL_COMMIT_ID]=4d45bc1ee66bbf5667f43cedf7a6f02593bba663" \
//      -F "variables[MODEL_FILENAME]=ipNetToMediaTable.yang" \
//      -F "variables[MODEL_NAME]=arp" \
//      -F "variables[MODEL_URL]=git@gitlab.tinaa.osc.tac.net:devops-irc/yang-evolution-scenarios.git" \
//      -F "variables[URL]=git@gitlab.tinaa.osc.tac.net:devops-irc/yang-evolution-scenarios.git" \
// https://gitlab.tinaa.osc.tac.net/api/v4/projects/720/trigger/pipeline
 