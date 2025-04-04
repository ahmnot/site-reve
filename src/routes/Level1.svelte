<script>
	import Tree from './tree-components/Tree.svelte';
	import BoxWithAWordWithNuageTarget from './BoxWithAWordWithNuageTarget.svelte';
	import Rain from './nuage-components/Rain.svelte';
	import Nuage from './nuage-components/Nuage.svelte';
	import MagicSeed from './tree-components/MagicSeed.svelte';
	import NegativeCube3DScene from './NegativeCube3DScene.svelte';

	import { isRainTriggered } from '../lib/rainStore.js';
	import { isMagicSeedBloomTriggered, magicSeedBloomLeftOffset, magicSeedBloomBottomOffset } from '../lib/magicSeedBloomStore.js';

	let expanded = true;
	let isFirstClick = false;
	let oldMagicSeedWasClicked = false;

	// GROWTH TRIGGERING LOGIC
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

	isRainTriggered.subscribe((value) => {
		if (value) {
			// If this is the first time value becomes true, set the timestamp
			if (rainTriggeringStartTimestamp === null) {
				rainTriggeringStartTimestamp = Date.now();
			}

			// Start the interval if rain is triggered
			if (!rainInterval) {
				rainInterval = setInterval(() => {
					const elapsedTime = Date.now() - rainTriggeringStartTimestamp;
					if (elapsedTime >= 2000) {
						// Only increment the counter after a little while have passed (2 seconds)
						rainCounter++;
						if (rainCounter >= 35) {
							isFirstBranchGrowing = true;
							clearInterval(rainInterval); // Stop the interval when the branch starts growing
							rainInterval = null; // Clear the interval reference
							isCloudAndRainHidden = true;
						}
					}
				}, 100); // Increment every 100ms
			}
		} else {
			// Reset the timestamp and stop the interval when rain is not triggered
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

	// Unique ID generator using a counter
	let idCounter = 0;
	function generateUniqueId(prefix = '') {
		idCounter += 1;
		return `${prefix}-${idCounter}`;
	}

	// Function to pick a random value with a random sign
	function getRandomValueWithSign(valuesToPickFrom) {
		const randomIndex = Math.floor(Math.random() * valuesToPickFrom.length);
		const randomValue = valuesToPickFrom[randomIndex];
		const randomSign = Math.random() < 0.5 ? -1 : 1;
		return randomValue * randomSign;
	}

	// Helper function to generate a random value between min and max
	function getRandomValue(min, max) {
		return Math.random() * (max - min) + min;
	}

	// Global flag to ensure the magic seed is generated only once
	let magicSeedGenerated = false;

	let trunkBranchPosition = 0;

	let newSetOfBranchesAngle;

	let magicSeedAngle;


	// Function to generate a tree with alternating degree angles
	function generateBranches(config) {
		const {
			numberOfBranches,
			depth,
			baseId,
			branchAngleLimitation,
			initialBranchAngle,
			initialBranchWidth,
			initialBranchLength,
			angleDecrementFactor,
			widthDecrementFactor,
			lengthDecrementFactor,
			leafProbability,
			spiralProbability,
			initialBranchOnBranchProbability,
			branchOnBranchProbabilityDecrementFactor,
			subBranchesFixedParameters = {}
		} = config;

		const finalBranches = [];
		let rotationToAdd = initialBranchAngle;
		let currentWidth = initialBranchWidth;
		let currentLength = initialBranchLength;
		let currentBranchOnBranchProbability = initialBranchOnBranchProbability;
		let inSpiralMode = false;
		let absoluteAngle = 0;
		let spirallingCount = 0;

		let magicSeedCondition =
			depth == initialDepth - 1 &&
			!magicSeedGenerated &&
			trunkBranchPosition > magicSeedBranchPosition
			&& !oldMagicSeedWasClicked;

		let parentBranch = {
			id: generateUniqueId(baseId),
			zIndex: magicSeedCondition ? 999 : 0,
			width: `${currentWidth}px`,
			length: magicSeedCondition ? '4vw' : `${currentLength}px`,
			rotation: magicSeedCondition ? '90deg' : `${rotationToAdd}deg`,
			color: 'tan',
			windIntensity: `0px`,
			swayOnHover:true,
			childBranches: []
		};

		finalBranches.push(parentBranch);

		let childBranch;

		for (let i = 0; i < numberOfBranches; i++) {
			if (depth == initialDepth) {
				trunkBranchPosition = i;
			}

			currentWidth *= widthDecrementFactor;
			currentLength *= lengthDecrementFactor;
			currentBranchOnBranchProbability *= branchOnBranchProbabilityDecrementFactor;

			rotationToAdd = getRandomValueWithSign([
				2.8125, 5.625, 11.25
				//, 22.5, 45, 90
			]);

			// Control the general direction of the branch
			if (Math.abs(absoluteAngle + rotationToAdd) > branchAngleLimitation) {
				rotationToAdd = 0;
			}

			if (!inSpiralMode && Math.random() < spiralProbability && i < numberOfBranches - 4) {
				inSpiralMode = true;
				spirallingCount = 0;
			}

			if (inSpiralMode) {
				rotationToAdd = 90;
				spirallingCount++;
				if (spirallingCount >= 4) {
					inSpiralMode = false;
				}
			} else {
				rotationToAdd *= angleDecrementFactor;
			}

			absoluteAngle = (absoluteAngle + rotationToAdd) % 360;

			childBranch = {
				id: generateUniqueId(baseId),
				zIndex: 5,
				width: `${currentWidth}px`,
				length: `${currentLength}px`,
				rotation: `${rotationToAdd}deg`,
				color: 'tan',
				windIntensity: `3px`,
				windy: i % 3 == 0,
				childBranches: []
			};

			// Generation of magic seed on a special branch at approximately at 2/3 of the main branch, on the tip of that branch
			// We don't re-generate the magic seed if it was already clicked.
			if (magicSeedCondition && i == numberOfBranches - 1) {
				childBranch.childBranches.push({
					id: generateUniqueId(`${childBranch.id}-seed`),
					zIndex: 999,
					width: '50px',
					length: '50px',
					rotation: absoluteAngle,
					magicseed: true
				});
				magicSeedGenerated = true;
				magicSeedAngle = absoluteAngle;
			}

			// Leaves generated on magic branch : The i < 7 is here to prevent leaves overlapping the magic seed
			if (magicSeedCondition && i < 7) {
				childBranch.childBranches.push({
					id: generateUniqueId(`${childBranch.id}-leaf`),
					zIndex: 50,
					width: `${getRandomValue(8, 10)}px`,
					length: `${getRandomValue(14, 15)}px`,
					rotation: `${Math.random() < 0.5 ? 90 : -90}deg`,
					color: 'forestgreen',
					windIntensity: `${1 / (widthDecrementFactor * 0.95)}px`,
					childBranches: []
				});
			}

			parentBranch.childBranches.push(childBranch);

			// Leaves generated when not on magic seed branch
			if (!magicSeedCondition && Math.random() < leafProbability) {
				childBranch.childBranches.push({
					id: generateUniqueId(`${childBranch.id}-leaf`),
					zIndex: 100,
					width: `${getRandomValue(8, 10)}px`,
					length: `${getRandomValue(12, 15)}px`,
					rotation: `${Math.random() < 0.5 ? 90 : -90}deg`,
					color: 'forestgreen',
					windIntensity: `${2 / (widthDecrementFactor * 0.95)}px`,
					windy: i % 9 == 0,
					childBranches: []
				});
			}

			newSetOfBranchesAngle =
				-absoluteAngle + getRandomValueWithSign([10, 20, 45].map((a) => a * angleDecrementFactor));

			if (depth > 0 && Math.random() < currentBranchOnBranchProbability) {
				childBranch.childBranches.push(
					...generateBranches({
						numberOfBranches: Math.floor(numberOfBranches / 1.5),
						depth: depth - 1,
						baseId: `${baseId}-${i}`,
						initialBranchAngle: newSetOfBranchesAngle,
						...subBranchesFixedParameters
					})
				);
			}

			parentBranch = childBranch;

			if (i === numberOfBranches - 1 && !magicSeedCondition) {
				childBranch.childBranches.push({
					id: generateUniqueId(`${childBranch.id}-leaf`),
					zIndex: 100,
					width: '10px',
					length: '12px',
					rotation: `-90deg`,
					color: Math.random() < 0.5 ? 'thistle' : 'mistyrose',
					windIntensity: '10px',
					childBranches: []
				});
			}
		}

		return finalBranches;
	}

	let innerHeight = 0;

	let trunkNumberOfBranches = 0;
	let mainBranchAngleDecrementFactor = 0.75;
	$: innerHeight > 700 ? trunkNumberOfBranches = innerHeight / 42 : trunkNumberOfBranches = innerHeight / 30;
	$: innerHeight > 700 ? mainBranchAngleDecrementFactor = 0.75 : mainBranchAngleDecrementFactor = 0.5;
	$: initialBranchWidth = innerHeight / 33;
	$: initialBranchLength = initialBranchWidth;
	$: magicSeedBranchPosition = (2 * trunkNumberOfBranches) / 3 - 2;

	// Reset magicSeedGenerated when window is resized
	$: if (innerHeight) {
		magicSeedGenerated = false;
	}

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
		branchOnBranchProbabilityDecrementFactor: 0.5
	};

	$: allTheBranches = generateBranches({
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
		subBranchesFixedParameters
	});

	function handleMagicSeedClick() {
		oldMagicSeedWasClicked = true;
	}

	$: treeGroundPosition = innerHeight *0.8;

	let showNegativeCube = false;

	$: if ($isMagicSeedBloomTriggered) {
		// Delay showing the NegativeCube component
		setTimeout(() => {
			showNegativeCube = true;
		}, 1000);
	}
</script>

<svelte:window bind:innerHeight />

<div class="outer-container">
	<div class="central" class:expanded>
		<BoxWithAWordWithNuageTarget {expanded} {toggleExpanded} {oldMagicSeedWasClicked} {isCloudAndRainHidden}>
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
			<MagicSeed slot="magicSeedSlot" growing="true" rotation="0" parentLength="0" {blooming} {leftOffset} {bottomOffset}></MagicSeed>
		
			<NegativeCube3DScene slot="negativeCubeSlot" isVisible={showNegativeCube} />
		</BoxWithAWordWithNuageTarget>
	</div>
</div>


<style>
	:root {
		--aspect-ratio: calc(9 / 16);
	}

	.outer-container {
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
