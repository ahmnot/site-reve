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

	// 0 = Level3, 1 = Level1, 2 = Level2
	let currentLevel = 1;
	let mounted = false;
	let fixedHeight = 0; // Hauteur fixée au chargement, ne change JAMAIS

	// store pour animer la translation
	const offsetY = tweened(0, { duration: 800, easing: cubicOut });

	onMount(async () => {
		// CRITIQUE : Fixer la hauteur une seule fois au chargement
		// et ne JAMAIS la changer ensuite
		if (window.visualViewport) {
			fixedHeight = window.visualViewport.height;
		} else {
			fixedHeight = window.innerHeight;
		}

		// Appliquer la hauteur fixe via une variable CSS
		document.documentElement.style.setProperty('--fixed-viewport-height', `${fixedHeight}px`);

		// position initiale **sans animation** sur Level1
		offsetY.set(-fixedHeight * currentLevel, { duration: 0 });

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
		}, 2000);

		// IMPORTANT : Écouter UNIQUEMENT les vrais redimensionnements (rotation d'écran)
		// pas les changements de clavier
		if (window.visualViewport) {
			let resizeTimer;
			window.visualViewport.addEventListener('resize', () => {
				clearTimeout(resizeTimer);
				// Attendre 300ms pour s'assurer que ce n'est pas juste le clavier
				resizeTimer = setTimeout(() => {
					const newHeight = window.visualViewport.height;
					const heightDiff = Math.abs(newHeight - fixedHeight);
					
					// Ne mettre à jour QUE si c'est une vraie rotation (grande différence de hauteur)
					// ET que la hauteur augmente (clavier qui se ferme ou rotation)
					if (heightDiff > 150 && newHeight > fixedHeight * 0.8) {
						fixedHeight = newHeight;
						document.documentElement.style.setProperty('--fixed-viewport-height', `${fixedHeight}px`);
						offsetY.set(-fixedHeight * currentLevel, { duration: 0 });
					}
				}, 300);
			});
		}

		// Fallback pour les navigateurs sans visualViewport (très vieux navigateurs)
		// Mais on veut éviter de réagir au clavier ici aussi
		let orientationChangeTimer;
		window.addEventListener('orientationchange', () => {
			clearTimeout(orientationChangeTimer);
			orientationChangeTimer = setTimeout(() => {
				if (!window.visualViewport) {
					fixedHeight = window.innerHeight;
					document.documentElement.style.setProperty('--fixed-viewport-height', `${fixedHeight}px`);
					offsetY.set(-fixedHeight * currentLevel, { duration: 0 });
				}
			}, 300);
		});
	});

	function monter() {
		if (currentLevel > 0) {
			currentLevel -= 1;
			offsetY.set(-fixedHeight * currentLevel);
		}
	}

	function descendre() {
		if (currentLevel < 2) {
			currentLevel += 1;
			offsetY.set(-fixedHeight * currentLevel);
		}
	}

	$: if ($showLevel2 && Level2Component) {
		descendre();
	}

	$: if ($showLevel3 && Level3Component) {
		monter();
	}
	
</script>

<!-- IMPORTANT : Ne PAS binder innerHeight car ça change avec le clavier ! -->
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
{/if}

<style>
	/* CRITIQUE : Utiliser la variable CSS fixe au lieu de dvh/vh */
	.viewport {
		height: var(--fixed-viewport-height, 100vh);
		width: 100%;
		max-width: 100vw;
		overflow: hidden;
		overflow-x: hidden;
		position: relative;
	}

	.levels {
		/* 3x la hauteur fixe */
		height: calc(var(--fixed-viewport-height, 100vh) * 3);
		width: 100%;
		position: relative;
	}
	
	.level {
		/* Chaque niveau a la hauteur fixe */
		height: var(--fixed-viewport-height, 100vh);
		width: 100%;
		position: relative;
		overflow: hidden;
	}

	.loading {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100%;
		font-size: 3rem;
	}
</style>