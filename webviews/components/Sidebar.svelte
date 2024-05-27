<script context="module" lang='ts'>
  declare function acquireVsCodeApi(): any;
  const vscode = acquireVsCodeApi();

  function runPyangCommand() {
    vscode.postMessage({
      type: 'runPyang'
    });
  }
  function validatePyangFile() {
    vscode.postMessage({
      type: 'validatePyang'
    });
  }
</script>
<button on:click={runPyangCommand}>Run Pyang Command</button>
<button on:click={validatePyangFile}>Validate Pyang File</button>

<!-- markup (zero or more items) goes here -->

<style>
	/* styles go here */
</style>