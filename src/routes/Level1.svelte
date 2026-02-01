<script>
	// Level1.svelte
	import { onMount } from 'svelte';
	import TreeWebGL from './tree-components/TreeWebGL.svelte';
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

	import { generateBranches, resetBranchGeneration } from '../lib/branchesStore.js';

	import { showTextInput } from '../lib/textInputStore.js';
	import TextInput from './TextInput.svelte';
	import { showLevel2, showLevel3 } from '../lib/levelStore.js';

	import { sessionStore } from '../lib/sessionStore.js';

	let expanded = true;
	let isFirstClick = false;
	let oldMagicSeedWasClicked = false;

	let isFirstBranchGrowing = false;
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
	let isRestoringFromSession = false;

	let targetOffsetLeft = 0;
	let targetOffsetTop = 0;

	function updateTargetOffset() {
		const targetElem = document.querySelector('#target');
		if (targetElem) {
			const rect = targetElem.getBoundingClientRect();
			// Centrer le canvas sur le target
			targetOffsetLeft = rect.left + rect.width / 2;
			targetOffsetTop = rect.top + rect.height / 2;
		}
	}

	const savedSession = sessionStore.loadSession();
	if (savedSession) {
		isCloudAndRainHidden = savedSession.isCloudAndRainHidden;
		isFirstBranchGrowing = savedSession.isFirstBranchGrowing;
		isRestoringFromSession = true;
		console.log('Session restaurée:', savedSession);
	}

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

							sessionStore.saveSession(true, true);
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

	// Paramètres pour l'arbre
	let innerHeight = 0;
	let innerWidth = 0;
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
		isWindy: true
	};

	let allTheBranches;

	// Fonction pour générer l'arbre
	function generateTree() {
		if (oldMagicSeedWasClicked) return; // Ne pas régénérer si la seed a été cliquée

		resetBranchGeneration();

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
			isWindy: true
		});
	}

	// Régénérer l'arbre quand la taille de la fenêtre change
	$: if (innerHeight && innerWidth && !oldMagicSeedWasClicked) {
		generateTree();
	}

	function handleMagicSeedClick() {
		oldMagicSeedWasClicked = true;
	}

	$: treeGroundPosition = innerHeight * 0.8;
	let showNegativeCube = false;
	$: if ($isMagicSeedBloomTriggered) {
		setTimeout(() => {
			showNegativeCube = true;
		}, 2000);
	}

	// Mettre à jour l'offset au resize
	$: if (innerHeight && innerWidth) {
		setTimeout(() => updateTargetOffset(), 0);
	}

	function handleTextSubmit(e) {
		const value = e.detail.value;
		console.log('Texte validé :', value);
		if (value.toUpperCase() === 'INFRAMONDE') {
			showLevel2.set(true);
			showTextInput.set(false);
		} else if (value.toUpperCase() === 'SUPRAMONDE') {
			showLevel3.set(true);
			showTextInput.set(false);
		}
	}

	onMount(() => {
		updateTargetOffset();
		window.addEventListener('resize', updateTargetOffset);
		return () => window.removeEventListener('resize', updateTargetOffset);
	});
</script>

<svelte:window bind:innerHeight bind:innerWidth />

<div
	class="outer-container"
	on:touchstart|capture={(e) => {
		if (e.target.tagName === 'INPUT') {
			return;
		}
	}}
>
	{#if $showTextInput}
		<TextInput on:submit={handleTextSubmit} />
	{/if}
	<div class="central" class:expanded>
		<BoxWithAWordWithNuageTarget
			{expanded}
			{toggleExpanded}
			{oldMagicSeedWasClicked}
			{isCloudAndRainHidden}
			{isRestoringFromSession}
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
			<TreeWebGL
				slot="treeSlot"
				leftPosition="50%"
				treeGround="{treeGroundPosition}px"
				offsetLeft={targetOffsetLeft}
				offsetTop={targetOffsetTop}
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
