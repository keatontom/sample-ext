<script context="module" lang='ts'>
  declare function acquireVsCodeApi(): any;
</script>

<script lang='ts'>
  const vscode = acquireVsCodeApi();

  let fileName = '';
  let treeViewData = '';

  window.addEventListener('message', event => {
    const message = event.data;
    switch (message.type) {
      case 'showTreeView':
        treeViewData = message.value;
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

  // Reactive statement to log changes
  $: {
    console.log("Reactive - Tree View Data updated:", treeViewData);
  }
</script>

<input type="text" bind:value={fileName} placeholder="Enter file name" style="text-align: center" />
<button on:click={validatePyangFile10}>Validate Pyang File 1.0</button>
<button on:click={validatePyangFile11}>Validate Pyang File 1.1</button>
<button on:click={treeView}>Show Tree View</button>

{#if treeViewData}
  <pre>{treeViewData}</pre>
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
