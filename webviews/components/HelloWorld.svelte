<script lang="ts">
	// Any logic can be added here
</script>

<!-- Markup for three horizontal text fields -->
<div class="container">
	<input type="text" placeholder="Row 1"/>
	<input type="text" placeholder="Row 2"/>
	<input type="text" placeholder="Row 3"/>
</div>

<style>
	/* Container to hold the text fields */
	.container {
		display: flex;
		gap: 10px;
		height: 100vh; /* Fill to the bottom */
	}

	/* Styling for the input fields */
	input[type="text"] {
		flex: 1;
		padding: 10px;
		box-sizing: border-box;
		height: 100%; /* Fill to the bottom */
	}
</style>
