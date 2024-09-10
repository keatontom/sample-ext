import * as vscode from 'vscode';
import * as fs from 'fs';
import * as https from 'https';
import axios, { post } from 'axios';
import FormData from 'form-data'; // Import FormData
import path from 'path';
import AdmZip from 'adm-zip';
import { SidebarProvider } from './SidebarProvider';
import * as os from 'os';


export async function getArtifacts(
    sidebarProvider: SidebarProvider,
    privateToken: string,
    pathToCert: string,
    pipelineId: number

) {
    if (!pipelineId) {
        vscode.window.showErrorMessage('Pipeline ID is required to get artifacts.');
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
            const jobs = response.data.filter((job: any) => job.status === 'success' && job.artifacts_file);

            if (jobs.length === 0) {
                vscode.window.showInformationMessage('No artifacts found for this pipeline.');
                return;
            }

            const artifactJob = jobs[0];
            const artifactUrl = `https://gitlab.tinaa.osc.tac.net/api/v4/projects/720/jobs/${artifactJob.id}/artifacts`;

            // Fix outputDir construction
            let outputDir = path.join(vscode.workspace.rootPath || os.tmpdir(), `pipeline-${pipelineId}-artifacts`);
            const outputPath = path.join(outputDir, artifactJob.artifacts_file.filename);

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

            fs.writeFileSync(outputPath, artifactResponse.data);
            const zip = new AdmZip(outputPath);
            zip.extractAllTo(outputDir, true);
            fs.unlinkSync(outputPath);

            if (fs.existsSync(outputDir) && fs.readdirSync(outputDir).length > 0) {
                const openFolder = await vscode.window.showInformationMessage(`Artifacts downloaded to ${outputDir}. Would you like to open the artifacts?`, 'Yes', 'No');
                if (openFolder === 'Yes') {
                    const uri = vscode.Uri.file(outputDir);
                    vscode.commands.executeCommand('vscode.openFolder', uri, { forceNewWindow: true });
                } 
            } else {
                vscode.window.showErrorMessage('Artifacts extraction failed');
            }

        } else {
            vscode.window.showInformationMessage('No successful jobs with artifacts found for this pipeline.');
        }
    } catch (error: unknown) {
        if (error instanceof Error) {
            vscode.window.showErrorMessage(`Error fetching artifacts: ${error.message}`);
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

            const jobNames = jobs.map((job: any) => `${job.name}`);
            const selectedJob = await vscode.window.showQuickPick(jobNames, {
              placeHolder: 'Select a job to view details',
            });
          
            if (selectedJob) {
              const selectedJobDetails = jobs.find(
                (job: any) => `${job.name}` === selectedJob
              );
              if (selectedJobDetails) {
                const jobDetails = `**Job Name**: ${selectedJobDetails.name}\n` +
                  `**Status**: ${selectedJobDetails.status}\n` +
                  `**Started At**: ${selectedJobDetails.started_at || 'N/A'}\n` +
                  `**Finished At**: ${selectedJobDetails.finished_at || 'N/A'}`;
          
                // Show job details in an information message
                vscode.window.showInformationMessage(jobDetails, { modal: true });
              }
            }
        } else {
            vscode.window.showInformationMessage('No jobs found for this pipeline.');
        }
    } catch (error: unknown) {
        if (error instanceof Error) {
            vscode.window.showErrorMessage(`Error fetching artifacts: ${error.message}`);
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