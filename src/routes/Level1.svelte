<script>
	// Level1.svelte
	import Tree from './tree-components/Tree.svelte';
	import BoxWithAWordWithNuageTarget from './BoxWithAWordWithNuageTarget.svelte';
	import Rain from './nuage-components/Rain.svelte';
	import Nuage from './nuage-components/Nuage.svelte';
	import MagicSeed from './tree-components/MagicSeed.svelte';
	import NegativeCube3DScene from './NegativeCube3DScene.svelte';

	import { isRainTriggered } from '../lib/rainStore.js';
	import {
		isMagicSeedBloomTriggered,
		magicSeedBloomLeftOffset,
		magicSeedBloomBottomOffset
	} from '../lib/magicSeedBloomStore.js';

	// Import du store pour la génération des branches
	import { generateBranches, resetBranchGeneration } from '../lib/branchesStore.js';

	import { showTextInput } from '../lib/textInputStore.js';
	import TextInput from './TextInput.svelte';
	import { showLevel2, showLevel3 } from '../lib/levelStore.js';

	let expanded = true;
	let isFirstClick = false;
	let oldMagicSeedWasClicked = false; // Détermine si la magicSeed a déjà été cliquée

	// Configuration des petites graines
	const smallMagicSeedsConfig = [
		{ index: 0, ratio: 0.25, direction: 'left' },
		{ index: 1, ratio: 0.5, direction: 'right' },
		{ index: 2, ratio: 0.75, direction: 'left' }
	];

	// GROWTH TRIGGERING LOGIC
	let isFirstBranchGrowing = true;
	let rainCounter = 0;
	let rainInterval;
	let rainTriggeringStartTimestamp = null;

	let blooming = false;
	isMagicSeedBloomTriggered.subscribe((value) => {
		blooming = value;
	});

	let leftOffset = 0;
	magicSeedBloomLeftOffset.subscribe((value) => {
		leftOffset = value;
	});

	let bottomOffset = 0;
	magicSeedBloomBottomOffset.subscribe((value) => {
		bottomOffset = value;
	});

	let isCloudAndRainHidden = false;

	let boxWithAWordComponent;

	isRainTriggered.subscribe((value) => {
		if (value) {
			if (rainTriggeringStartTimestamp === null) {
				rainTriggeringStartTimestamp = Date.now();
			}
			if (!rainInterval) {
				rainInterval = setInterval(() => {
					const elapsedTime = Date.now() - rainTriggeringStartTimestamp;
					if (elapsedTime >= 2000) {
						rainCounter++;
						if (rainCounter >= 35) {
							isFirstBranchGrowing = true;
							clearInterval(rainInterval);
							rainInterval = null;
							isCloudAndRainHidden = true;
						}
					}
				}, 100);
			}
		} else {
			rainTriggeringStartTimestamp = null;
			if (rainInterval) {
				clearInterval(rainInterval);
				rainInterval = null;
			}
		}
	});

	function toggleExpanded() {
		if (isFirstClick) {
			expanded = true;
			isFirstClick = false;
		}
	}

	// Lors d'un redimensionnement, on régénère l’arbre **seulement si la magicSeed n’a pas été cliquée**
	$: if (!oldMagicSeedWasClicked && innerHeight) {
		resetBranchGeneration();
		// Calcul des paramètres basés sur l'innerHeight
		trunkNumberOfBranches = innerHeight > 700 ? innerHeight / 42 : innerHeight / 30;
		mainBranchAngleDecrementFactor = innerHeight > 700 ? 0.75 : 0.5;
		initialBranchWidth = innerHeight / 33;
		initialBranchLength = initialBranchWidth;
		magicSeedBranchPosition = (2 * trunkNumberOfBranches) / 3 - 2;

		allTheBranches = generateBranches({
			numberOfBranches: trunkNumberOfBranches,
			depth: initialDepth,
			baseId: '',
			branchAngleLimitation: 10,
			initialBranchAngle: 0,
			initialBranchWidth: initialBranchWidth,
			initialBranchLength: initialBranchLength,
			angleDecrementFactor: mainBranchAngleDecrementFactor,
			widthDecrementFactor: 0.9,
			lengthDecrementFactor: 0.97,
			leafProbability: 0.01,
			spiralProbability: 0,
			initialBranchOnBranchProbability: 0.05,
			branchOnBranchProbabilityDecrementFactor: 1.6,
			subBranchesFixedParameters,
			initialDepth,
			magicSeedBranchPosition,
			oldMagicSeedWasClicked,
			smallMagicSeedsPositions: smallMagicSeedsConfig
		});
	}

	// Paramètres pour l’arbre
	let innerHeight = 0;
	let trunkNumberOfBranches = 0;
	let mainBranchAngleDecrementFactor = 0.75;
	let initialBranchWidth, initialBranchLength, magicSeedBranchPosition;
	const initialDepth = 2;
	const subBranchesFixedParameters = {
		branchAngleLimitation: 25,
		initialBranchWidth: 5,
		initialBranchLength: 20,
		angleDecrementFactor: 0.98,
		lengthDecrementFactor: 0.95,
		widthDecrementFactor: 0.85,
		leafProbability: 0.98,
		spiralProbability: 0.05,
		initialBranchOnBranchProbability: 0.1,
		branchOnBranchProbabilityDecrementFactor: 0.5,
		isWindy: true,
	};

	// Génération initiale de l’arbre (se déclenche uniquement si la magicSeed n’a pas encore été cliquée)
	let allTheBranches;
	if (!oldMagicSeedWasClicked) {
		allTheBranches = generateBranches({
			numberOfBranches: trunkNumberOfBranches,
			depth: initialDepth,
			baseId: '',
			branchAngleLimitation: 10,
			initialBranchAngle: 0,
			initialBranchWidth: initialBranchWidth,
			initialBranchLength: initialBranchLength,
			angleDecrementFactor: mainBranchAngleDecrementFactor,
			widthDecrementFactor: 0.9,
			lengthDecrementFactor: 0.97,
			leafProbability: 0.01,
			spiralProbability: 0,
			initialBranchOnBranchProbability: 0.05,
			branchOnBranchProbabilityDecrementFactor: 1.6,
			subBranchesFixedParameters,
			initialDepth,
			magicSeedBranchPosition,
			oldMagicSeedWasClicked,
			isWindy: true,
			smallMagicSeedsPositions: smallMagicSeedsConfig
		});
	}

	function handleMagicSeedClick() {
		// Une fois la magicSeed cliquée, le booléen passe à true
		oldMagicSeedWasClicked = true;
	}

	$: treeGroundPosition = innerHeight * 0.8;
	let showNegativeCube = false;
	$: if ($isMagicSeedBloomTriggered) {
		setTimeout(() => {
			showNegativeCube = true;
		}, 1000);
	}

// Gestion de la soumission du TextInput
function handleTextSubmit(e) {
	const value = e.detail.value;
	console.log('Texte validé :', value);
	if (value.toUpperCase() === 'INFRAMONDE') {
		// On met à jour le store pour afficher Level2
		showLevel2.set(true);
	} else if (value.toUpperCase() === 'SUPRAMONDE') {
		showLevel3.set(true);
	}
}

	// Fonction pour gérer les clics sur les petites graines
	function handleSmallMagicSeedClick(event) {
		// Transférer l'événement au composant BoxWithAWordWithNuageTarget
		boxWithAWordComponent?.handleSmallSeedClick(event);
	}

</script>

<svelte:window bind:innerHeight />

<div class="outer-container">

	{#if $showTextInput}
		<TextInput on:submit={handleTextSubmit} />
	{/if}
	<div class="central" class:expanded>
		<BoxWithAWordWithNuageTarget
			{expanded}
			{toggleExpanded}
			{oldMagicSeedWasClicked}
			{isCloudAndRainHidden}
			bind:this={boxWithAWordComponent}
		>
			<Nuage slot="nuageSlot" />
			<Rain
				slot="appearsWhenBoxInNuage"
				top="40%"
				width="80%"
				left="3%"
				rainGround="{treeGroundPosition}px"
				rainColor="rgba(176, 224, 230, 0.2)"
			/>
			<Tree
				slot="treeSlot"
				leftPosition="50%"
				treeGround="{treeGroundPosition}px"
				{isFirstBranchGrowing}
				{allTheBranches}
				on:branchMagicSeedWasClicked={handleMagicSeedClick}
			/>
			<MagicSeed
				slot="magicSeedSlot"
				growing="true"
				rotation="0"
				parentLength="0"
				{blooming}
				{leftOffset}
				{bottomOffset}
			/>
			
			<!-- Les 3 newSmallSeeds avec physique Matter.js -->
			<MagicSeed
				slot="smallSeedSlot0"
				growing="true"
				rotation="0"
				parentLength="0"
				isSmall={true}
				blooming={false}
			/>
			<MagicSeed
				slot="smallSeedSlot1"
				growing="true"
				rotation="0"
				parentLength="0"
				isSmall={true}
				blooming={false}
			/>
			<MagicSeed
				slot="smallSeedSlot2"
				growing="true"
				rotation="0"
				parentLength="0"
				isSmall={true}
				blooming={false}
			/>
			<NegativeCube3DScene slot="negativeCubeSlot" isVisible={showNegativeCube} />
		</BoxWithAWordWithNuageTarget>
	</div>
</div>

<style>
	:root {
		--aspect-ratio: calc(9 / 16);
	}

	.outer-container {
		position: relative;
		display: flex;
		justify-content: center;
		align-items: center;
		width: 100dvw;
		height: 100dvh;
	}

	.central {
		display: flex;
		justify-content: center;
		align-items: center;
		font-size: 1.5em;
		transition: all 0.5s ease-in-out;
		z-index: 0;
	}

	.central.expanded {
		width: calc(100dvh * var(--aspect-ratio));
		height: 100dvh;
		background-color: azure;
		max-width: 100dvw;
		max-height: 100dvh;
	}
</style>
