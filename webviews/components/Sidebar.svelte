<script lang="ts">
  let count = 0;
</script>

<style>
.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start; 
  height: 100vh;
  padding-top: 1rem; 
  text-align: center;
}

input {
  margin-bottom: 1rem; 
}

.count {
  font-size: 2rem; 
  margin: 1rem 0; 
}

button {
  margin-top: 1rem; 
}
</style>

<div class="container">
  <input />
  <div class="count">{count}</div>
  <button on:click={() => {
    count++;
  }}>Increment</button>
</div>
