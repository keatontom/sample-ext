<script context="module" lang='ts'>
  declare function acquireVsCodeApi(): any;
</script>

<script lang='ts'>

  const vscode = acquireVsCodeApi();

  let currentView = 'main';

  let fileName = '';
  let treeViewData = '';

  let gitLabUrl = 'https://gitlab.tinaa.osc.tac.net/api/v4/projects';
  let privateToken = 'aY_x1SxRm154wmsbhNmF';
  let pathToCert = '/usr/local/share/ca-certificates/TCSO-root-CA.crt';

  let projectName = '';
  let groupId = '';

  let ref = '';
  let triggerToken = '';
  let projectId = '';


  window.addEventListener('message', event => {
    const message = event.data;
    switch (message.type) {
      case 'showTreeView':
        treeViewData = message.value;
        break;
      case 'connectedToGitLab':
        currentView = 'GitLabActions';
        break;
    }
  });

  function validatePyangFile10() {
    vscode.postMessage({
      type: 'validatePyang10',
      value: fileName
    });
  }

  function validatePyangFile11() {
    vscode.postMessage({
      type: 'validatePyang11',
      value: fileName
    });
  }

  function treeView() {
    vscode.postMessage({
      type: 'tree',
      value: fileName
    });
  }

  function navigateToGitLab() {
    currentView = 'gitlab'
  }

  function navigateToYang() {
    currentView = 'yang'
  }

  function backToMain() {
    currentView = 'main'
  }

  function backToGitLabActions() {
    currentView = 'GitLabActions'
  }

  function createRepoPage() {
    currentView = 'createRepo'
  }

  function connectToGitLab() {
    vscode.postMessage({
      type: 'connectToGitLab',
      value:{ 
        gitLabUrl,
        privateToken,
        pathToCert
      }
    });
  }

  function createGitLabRepo() {
    vscode.postMessage({
      type: 'createGitLabRepo',
      value: {
        projectName,
        groupId,
        gitLabUrl,
        privateToken,
        pathToCert
      }
    })
  }

  function triggerPipelinePage() {
    currentView = 'triggerPipeline'
  }

  function triggerPipeline() {
    vscode.postMessage({
      type: 'triggerPipeline',
      value: {
        projectId,
        ref,
        triggerToken,
        privateToken,
        pathToCert
      }
    })
  }


  // Reactive var
  $: {
    console.log("Reactive - Tree View Data updated:", treeViewData);
  }
</script>

<!--Main View-->
{#if currentView === 'main'}
  <button on:click={navigateToYang}>Yang Edit</button>
  <button on:click={navigateToGitLab}>Connect to GitLab</button>
{/if}

<!--Yang Edit View-->
{#if currentView === 'yang'}
  <input type="text" bind:value={fileName} placeholder="Enter file name" style="text-align: center" />
  <button on:click={validatePyangFile10}>Validate Pyang File 1.0</button>
  <button on:click={validatePyangFile11}>Validate Pyang File 1.1</button>
  <button on:click={treeView}>Show Tree View</button>

  {#if treeViewData}
    <pre>{treeViewData}</pre>
  {/if}
{/if}

<!--GitLab Connection View-->
{#if currentView === 'gitlab'}
  <input type="text" bind:value={gitLabUrl} placeholder="Enter GitLab URL"/>
  <input type="text" bind:value={privateToken} placeholder="Enter Token"/>
  <input type="text" bind:value={pathToCert} placeholder="Enter Certificate Path"/>
  <button on:click={connectToGitLab}>Connect</button>
  <button on:click={backToMain}>Back</button>
{/if}

<!--GitLab Actions View-->
{#if currentView === 'GitLabActions'}
  <button on:click={createRepoPage}>Create GitLab Repo</button>
  <button on:click={triggerPipelinePage}>Trigger Pipeline</button>
  <button on:click={backToMain}>Back</button>
{/if}

        <!--GitLab Create Project/Repo View-->
        {#if currentView === 'createRepo'}
          <input type="text" bind:value={projectName} placeholder="Enter Project Name"/>
          <input type="text" bind:value={groupId} placeholder="Enter Group Id"/>
          <button on:click={createGitLabRepo}>Create Repo</button>
          <button on:click={backToGitLabActions}>Back</button>
        {/if}

        <!--GitLab Trigger Pipeline View-->
        {#if currentView === 'triggerPipeline'}
          <input type="text" bind:value={projectId} placeholder="Enter Pipeline Project ID"/>
          <input type="text" bind:value={ref} placeholder="Enter Branch or Tag Name"/>
          <input type="text" bind:value={triggerToken} placeholder="Enter Pipeline Trigger Token"/>
          <button on:click={triggerPipeline}>Trigger Pipeline</button>
          <button on:click={backToGitLabActions}>Back</button>
        {/if}


<style>
  pre {
    white-space: pre-wrap;
    word-wrap: break-word;
    background-color: darkgrey;
    padding: 10px;
    border: 3px solid grey;
    color: black;
  }
</style>

