import * as vscode from 'vscode';
import * as fs from 'fs';
import * as https from 'https';
import axios, { post } from 'axios';
import FormData from 'form-data'; // Import FormData
import path from 'path';
import AdmZip from 'adm-zip';
import { SidebarProvider } from './SidebarProvider';

export async function getArtifacts(
    sidebarProvider: SidebarProvider,
    privateToken: string,
    pathToCert: string,
    pipelineId: number
) {
    const ca = fs.readFileSync(pathToCert);
    const jobsUrl = `https://gitlab.tinaa.osc.tac.net/api/v4/projects/720/pipelines/${pipelineId}/jobs`;

    try {
        const response = await axios.get(jobsUrl, {
            headers: {
                'PRIVATE-TOKEN': privateToken,
            },
            httpsAgent: new https.Agent({
                ca: ca,
                rejectUnauthorized: false,
            }),
        });

        if (response.status === 200 && response.data.length > 0) {
            // Find the first successful job with artifacts
            const jobs = response.data.filter((job: any) => job.status === 'success' && job.artifacts_file);

            if (jobs.length === 0) {
                vscode.window.showInformationMessage('No artifacts found for this pipeline.');
                return;
            }

            const artifactJob = jobs[0]; // Get the first successful job with artifacts

            // Construct the artifact download URL
            const artifactUrl = `https://gitlab.tinaa.osc.tac.net/api/v4/projects/720/jobs/${artifactJob.id}/artifacts`;
            const outputDir = path.join(vscode.workspace.rootPath || '', `${artifactJob.name}-artifacts`);
            const outputPath = path.join(outputDir, artifactJob.artifacts_file.filename);

            // Ensure the output directory exists
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir);
            }

            const artifactResponse = await axios.get(artifactUrl, {
                responseType: 'arraybuffer',
                headers: {
                    'PRIVATE-TOKEN': privateToken,
                },
                httpsAgent: new https.Agent({
                    ca: ca,
                    rejectUnauthorized: false,
                }),
            });

            // Write the downloaded artifact ZIP file to the specified path
            fs.writeFileSync(outputPath, artifactResponse.data);
            vscode.window.showInformationMessage(`Artifacts downloaded to ${outputPath}`);
            // Unzip the file into the same directory using adm-zip
            const zip = new AdmZip(outputPath);
            zip.extractAllTo(outputDir, true);
            // Delete zip after extraction
            fs.unlinkSync(outputPath);
            // Open artifacts
            const uri = vscode.Uri.file(outputDir);
            vscode.commands.executeCommand('vscode.openFolder', uri, { forceNewWindow: false });

            

        } else {
            vscode.window.showInformationMessage('No successful jobs with artifacts found for this pipeline.');
        }
    } catch (error) {
        if (axios.isAxiosError(error)) {
            vscode.window.showErrorMessage(`Error fetching artifacts: ${error.message}`);
        } else if (error instanceof Error) {
            vscode.window.showErrorMessage(`Error: ${error.message}`);
        } else {
            vscode.window.showErrorMessage('Unknown error occurred');
        }
    }
}



export async function viewJob(
    sidebarProvider: SidebarProvider,
    privateToken: string,
    pathToCert: string,
    pipelineId: number
) {
    if (!pipelineId) {
        vscode.window.showErrorMessage('Pipeline ID is required to view jobs.');
        return;
    }

    const ca = fs.readFileSync(pathToCert);
    const jobsUrl = `https://gitlab.tinaa.osc.tac.net/api/v4/projects/720/pipelines/${pipelineId}/jobs`;

    try {
        const response = await axios.get(jobsUrl, {
            headers: {
                'PRIVATE-TOKEN': privateToken,
            },
            httpsAgent: new https.Agent({
                ca: ca,
                rejectUnauthorized: false,
            }),
        });

        if (response.status === 200 && response.data.length > 0) {
            const jobs = response.data;

            // Display jobs in a VS Code quick pick list
            const jobNames = jobs.map((job: any) => `${job.name} - ${job.status}`);
            const selectedJob = await vscode.window.showQuickPick(jobNames, {
                placeHolder: 'Select a job to view details'
            });

            if (selectedJob) {
                const selectedJobDetails = jobs.find((job: any) => `${job.name} - ${job.status}` === selectedJob);
                if (selectedJobDetails) {
                    vscode.window.showInformationMessage(`Job Name: ${selectedJobDetails.name}\nStatus: ${selectedJobDetails.status}\nStarted At: ${selectedJobDetails.started_at}\nFinished At: ${selectedJobDetails.finished_at}`);
                }
            }
        } else {
            vscode.window.showInformationMessage('No jobs found for this pipeline.');
        }
    } catch (error) {
        if (axios.isAxiosError(error)) {
            vscode.window.showErrorMessage(`Error fetching jobs: ${error.message}`);
        } else if (error instanceof Error) {
            vscode.window.showErrorMessage(`Error: ${error.message}`);
        } else {
            vscode.window.showErrorMessage('Unknown error occurred');
        }
    }
}

export async function triggerPipeline(
    sidebarProvider: SidebarProvider,
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

    const postdata = new FormData();
    postdata.append('token', triggerToken);
    postdata.append('ref', ref);
    postdata.append('variables[COMMIT_ID]', commitId);
    postdata.append('variables[ENTITY_NAME]', entityName);
    postdata.append('variables[MODEL_COMMIT_ID]', modelCommitId);
    postdata.append('variables[MODEL_FILENAME]', modelFilename);
    postdata.append('variables[MODEL_NAME]', modelName);
    postdata.append('variables[MODEL_URL]', modelUrl);
    postdata.append('variables[URL]', url);

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
            if (sidebarProvider._view) {
                sidebarProvider._view.webview.postMessage({
                    type: 'triggeredPipeline'
                });
            }

            const pipelinesUrl = `https://gitlab.tinaa.osc.tac.net/api/v4/projects/720/pipelines`;
            const pipelinesResponse = await axios.get(pipelinesUrl, {
                headers: {
                    'PRIVATE-TOKEN': privateToken,
                },
                httpsAgent: new https.Agent({
                    ca: ca,
                    rejectUnauthorized: false,
                }),
                params: {
                    ref: ref,
                    per_page: 1,
                    order_by: 'id',
                    sort: 'desc'
                }
            });

            if (pipelinesResponse.status === 200 && pipelinesResponse.data.length > 0) {
                const pipelineId = pipelinesResponse.data[0].id;
                vscode.window.showInformationMessage(`Pipeline ID: ${pipelineId}`);
                // Send the pipelineId back to the webview
                if (sidebarProvider._view) {
                    sidebarProvider._view.webview.postMessage({
                        type: 'pipelineId',
                        value: pipelineId
                    });
                }
            } else {
                vscode.window.showErrorMessage('Failed to retrieve the latest pipeline ID');
            }

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
//      -F "ref=fix_pipeline" \
//      -F "variables[COMMIT_ID]=aa201b60dd7f29a95c7a1618b193fec2cea62451" \
//      -F "variables[ENTITY_NAME]=pltf-arp-table" \
//      -F "variables[MODEL_COMMIT_ID]=aa201b60dd7f29a95c7a1618b193fec2cea62451" \
//      -F "variables[MODEL_FILENAME]=arp.yang" \
//      -F "variables[MODEL_NAME]=pltf-arp-table" \
//      -F "variables[MODEL_URL]=git@gitlab.tinaa.osc.tac.net:HOMA/entities/pltf-arp-table.git" \
//      -F "variables[URL]=git@gitlab.tinaa.osc.tac.net:HOMA/entities/pltf-arp-table.git" \
// https://gitlab.tinaa.osc.tac.net/api/v4/projects/720/trigger/pipeline