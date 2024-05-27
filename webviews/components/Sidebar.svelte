<script context="module" lang='ts'>
  declare function acquireVsCodeApi(): any;
  const vscode = acquireVsCodeApi();

  let fileName = '';

  function runPyangCommand() {
    vscode.postMessage({
      type: 'runPyang'
    });
  }
  function validatePyangFile() {
    vscode.postMessage({
      type: 'validatePyang',
      value: fileName
    });
  }
</script>
<button on:click={runPyangCommand}>Run Pyang Command</button>
<input type="text" bind:value={fileName} placeholder="Enter file name" />
<button on:click={validatePyangFile}>Validate Pyang File</button>

<!-- markup (zero or more items) goes here -->

<style>
	/* styles go here */
</style>