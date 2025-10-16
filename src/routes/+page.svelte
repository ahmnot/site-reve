<script>
	//+page.svelte
	import { onMount } from 'svelte';
	import '../css/global.css';
	import '../css/fonts.css';
	import { tweened } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';
	import { showLevel2, showLevel3 } from '../lib/levelStore.js';

	let Level1Component = null;
	let Level2Component = null;
	let Level3Component = null;

	let innerHeight;
	// 0 = Level3, 1 = Level1, 2 = Level2
	let currentLevel = 1;
	let mounted = false;

	// store pour animer la translation
	const offsetY = tweened(0, { duration: 800, easing: cubicOut });

	onMount(async () => {
		// position initiale **sans animation** sur Level1
		offsetY.set(-window.innerHeight * currentLevel, { duration: 0 });

		// Charger UNIQUEMENT Level1 au démarrage
		const level1Module = await import('./Level1.svelte');
		Level1Component = level1Module.default;
		// maintenant qu'on est à la bonne position, on peut afficher
		mounted = true;

		//Précharger les autres niveaux en arrière-plan (après 2 secondes)
		setTimeout(async () => {
			if (!Level2Component) {
				const level2Module = await import('./Level2.svelte');
				Level2Component = level2Module.default;
			}
			if (!Level3Component) {
				const level3Module = await import('./Level3.svelte');
				Level3Component = level3Module.default;
			}
		}, 2000); // Après 2 secondes d'affichage de Level1
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

	$: if ($showLevel2 && Level2Component) {
		descendre();
	}

	$: if ($showLevel3 && Level3Component) {
		monter();
	}
	
</script>

<svelte:window bind:innerHeight />
{#if mounted}
	<div class="viewport">
		<div class="levels" style="transform: translateY({$offsetY}px);">
			<!-- Level3 : chargé à la demande -->
			<div class="level">
				{#if Level3Component}
					<svelte:component this={Level3Component} />
				{:else}
					<div class="loading">✨</div>
				{/if}
			</div>

			<!-- Level1 : toujours chargé en premier -->
			<div class="level">
				{#if Level1Component}
					<svelte:component this={Level1Component} />
				{/if}
			</div>

			<!-- Level2 : chargé à la demande -->
			<div class="level">
				{#if Level2Component}
					<svelte:component this={Level2Component} />
				{:else}
					<div class="loading">⏳</div>
				{/if}
			</div>
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