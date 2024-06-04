<script context="module" lang='ts'>
  declare function acquireVsCodeApi(): any;
  const vscode = acquireVsCodeApi();

  let fileName = '';

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
</script>
<input type="text" bind:value={fileName} placeholder="Enter file name" style="text-align: center" />
<button on:click={validatePyangFile10}>Validate Pyang File 1.0</button>
<button on:click={validatePyangFile11}>Validate Pyang File 1.1</button>

