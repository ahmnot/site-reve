<script>
	//+page.svelte
	import { onMount } from 'svelte';
	import '../css/global.css';
	import '../css/fonts.css';
	import Level1 from './Level1.svelte';
	import Level2 from './Level2.svelte';
	import Ripple from './old-components/Ripple.svelte';
	import FlippableCard from './old-components/FlippableCard.svelte';
	import { startRipples, stopRipples, updateMousePosition } from '../lib/rippleStore.js';
	import MatterWorld from './old-components/MatterWorld.svelte';
	import ThreeWorld from './old-components/ThreeWorld.svelte';
	import NegativeCube3DScene from './NegativeCube3DScene.svelte';
	import { tweened } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';
	// Importer notre store
	import { showLevel2 } from '../lib/levelStore.js';

	// La valeur de translation verticale (en pixels)
	// On part de 0 (affichage de Level1)
	const offsetY = tweened(0, { duration: 800, easing: cubicOut });

	// Réaction au store : si showLevel2 passe à true, on passe à Level2
	$: {
		if ($showLevel2) {
			offsetY.set(-window.innerHeight);
		} else {
			offsetY.set(0);
		}
	}

	// La fonction toggleLevels peut toujours être utilisée pour un déclencheur manuel
	function toggleLevels() {
		showLevel2.update((current) => !current);
	}
</script>

<!-- Conteneur "viewport" qui masque le débordement -->
<div class="viewport">
	<!-- Conteneur avec la hauteur des deux niveaux, positionné via transform -->
	<div class="levels" style="transform: translateY({$offsetY}px);">
		<div class="level">
			<Level1 />
		</div>
		<div class="level">
			<Level2 />
		</div>
	</div>
</div>

<!-- Bouton de test, vous pouvez le retirer si le changement se fait uniquement depuis NegativeCube3DScene -->
<button on:click={toggleLevels}>
	{$showLevel2 ? 'Retour Level1' : 'Activer Level2'}
</button>

<!-- <div class="outer-container">
    <div class="grid-container">
        <div class="top-left-div">rêve</div>
        <div></div>
        <div on:mousedown={startRipples} on:mouseup={stopRipples} on:mousemove={updateMousePosition}>
            <Ripple />
        </div>
        <div class="left-div">
            <MatterWorld />
        </div>
        <div></div>
        <div class="negative-div">
            <NegativeCube3DScene />
        </div>
        <div></div>
        <div>
            <FlippableCard 
                faces={[
                    {text: "vie", color: "tomato"},
                    {text: "ciel", color: "LightSteelBlue"},
                    {text: "terre", color: "lightgreen"},
                    // Add more faces if needed
                ]}
            />
        </div>
        <div>
            <ThreeWorld />
        </div>
    </div>
</div> -->

<style>
	/* Le conteneur viewport prend toute la hauteur de la fenêtre et masque le débordement */
	.viewport {
		height: 100vh;
		overflow: hidden;
		position: relative;
	}
	/* Le conteneur des niveaux a une hauteur de 200vh (deux fois la hauteur du viewport) */
	.levels {
		height: 200vh;
		width: 100%;
		/* La propriété transform est contrôlée par la tweened store pour animer le scroll */
	}
	/* Chaque niveau occupe exactement la hauteur du viewport */
	.level {
		height: 100vh;
		width: 100%;
	}
	/* Un style basique pour le bouton */
	button {
		position: fixed;
		bottom: 20px;
		left: 20px;
		z-index: 10;
		padding: 0.5em 1em;
		font-size: 1rem;
	}

	.top-left-div {
		position: absolute;
		width: 100%;
		height: 100%;
		backface-visibility: hidden;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.5em;
	}

	.outer-container {
		display: flex;
		justify-content: center;
		align-items: center;
		width: 100vw;
		height: 100vh;
	}

	.grid-container {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		grid-template-rows: repeat(3, 1fr);
		width: 100vw;
		height: 100vh;
		max-width: calc(100vh * 9 / 16);
		max-height: calc(100vw * 16 / 9);
	}

	.grid-container > div {
		background-color: floralwhite;
		position: relative; /* Needed for ripple effect */
		overflow: hidden; /* Hide overflow for ripple effect */
	}

	.left-div {
		grid-area: 2 / 1;
		position: relative;
		overflow: hidden;
	}

	.negative-div {
		grid-area: 2 / 3;
		position: relative;
		overflow: hidden;
	}
</style>
