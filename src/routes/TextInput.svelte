<script>
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();
	let inputValue = '';

	function handleKeydown(event) {
		if (event.key === 'Enter') {
			const trimmed = inputValue.trim();
			if (trimmed.length > 0) {
				dispatch('submit', { value: trimmed });
				// Optionnel : vider le champ
				// inputValue = '';
			}
		}
	}
</script>

<style>
	.text-input-wrapper {
		position: fixed;
		top: 20px;
		left: 20px;
		background-color: #f1feff83;
		border: 1px solid #d3b58c73;
		z-index: 9999;
	}

	input {
		width: 250px;
		height: 32px;
		font-size: 1rem;
		font-family: 'Minecraft', sans-serif;
		border: none;
		outline: none;
		background: transparent;
	}
</style>

<div class="text-input-wrapper">
	<input
		type="text"
		bind:value={inputValue}
		on:keydown={handleKeydown}
	/>
</div>
