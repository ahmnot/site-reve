<script>
	//+page.svelte
	import { onMount } from 'svelte';
	import '../css/global.css';
	import '../css/fonts.css';
	import Level1 from './Level1.svelte';
	import Level2 from './Level2.svelte';
	import Level3 from './Level3.svelte';
	import { tweened } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';
	import { showLevel2, showLevel3 } from '../lib/levelStore.js';

	let innerHeight;
	// 0 = Level3, 1 = Level1, 2 = Level2
	let currentLevel = 1;
	let mounted = false;

	// store pour animer la translation
	const offsetY = tweened(0, { duration: 800, easing: cubicOut });

	onMount(() => {
		// position initiale **sans animation** sur Level1
		offsetY.set(-window.innerHeight * currentLevel, { duration: 0 });
		// maintenant qu'on est à la bonne position, on peut afficher
		mounted = true;
	});

	// Recalculer la position quand la hauteur de la fenêtre change
	$: if (mounted && innerHeight) {
		// Mise à jour sans animation lors du redimensionnement
		offsetY.set(-innerHeight * currentLevel, { duration: 0 });
	}

	function monter() {
		if (currentLevel > 0) {
			currentLevel -= 1;
			offsetY.set(-innerHeight * currentLevel);
		}
	}

	function descendre() {
		if (currentLevel < 2) {
			currentLevel += 1;
			offsetY.set(-innerHeight * currentLevel);
		}
	}

	$: if ($showLevel2) {
		descendre();
	}

	$: if ($showLevel3) {
		monter();
	}
</script>

<svelte:window bind:innerHeight />
{#if mounted}
	<div class="viewport">
		<div class="levels" style="transform: translateY({$offsetY}px);">
			<div class="level"><Level3 /></div>
			<div class="level"><Level1 /></div>
			<div class="level"><Level2 /></div>
		</div>
	</div>

	<!-- <div class="controls">
		<button on:click={monter} disabled={currentLevel === 0}>Monter</button>
		<button on:click={descendre} disabled={currentLevel === 2}>Descendre</button>
	</div> -->
{/if}

<style>
	.viewport {
		height: 100vh;
		overflow: hidden;
		position: relative;
	}
	.levels {
		/* Utilise la propriété CSS calc() pour toujours avoir 3x la hauteur viewport */
		height: 300vh;
		width: 100%;
		position: relative;
	}
	.level {
		height: 100vh;
		width: 100%;
		/* S'assure que chaque niveau reste bien contenu */
		position: relative;
		overflow: hidden;
	}
	/* .controls {
		position: fixed;
		bottom: 20px;
		left: 10%;
		transform: translateX(-50%);
		display: flex;
		gap: 0.5em;
		z-index: 10;
	}
	.controls button {
		padding: 0.5em 1em;
		font-size: 1rem;
	} */
</style>