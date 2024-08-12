<script>
	import '../global.css';
	import Tree from './Tree.svelte';
	import BoxWithTarget from './BoxWithTarget.svelte';
	import Rain from './Rain.svelte';
	import Nuage from './Nuage.svelte';
	import MagicSeed from './MagicSeed.svelte';

	let expanded = true;
	let isFirstClick = true;
	let isFirstBranchGrowing = false;
	let oldMagicSeedWasClicked = false;

	function toggleExpanded() {
		if (isFirstClick) {
			expanded = true;
			isFirstClick = false;
		}
	}

	function handleRainTriggering() {
		setTimeout(() => {
			isFirstBranchGrowing = true;
		}, 5000);
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
			trunkBranchPosition > Math.floor((2 * trunkNumberOfBranches) / 3) - 2;

		let parentBranch = {
			id: generateUniqueId(baseId),
			zIndex: magicSeedCondition ? 999 : 0,
			width: `${currentWidth}px`,
			length: magicSeedCondition ? '4vw' : `${currentLength}px`,
			rotation: magicSeedCondition ? '90deg' : `${rotationToAdd}deg`,
			color: 'tan',
			windIntensity: `0px`,
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

			rotationToAdd = getRandomValueWithSign(
				[2.8125, 5.625, 11.25
				//, 22.5, 45, 90
				]);

			// Control the general direction of the branch
			if (Math.abs(absoluteAngle + rotationToAdd) > branchAngleLimitation) {
				rotationToAdd = 0;
			}

			if (!inSpiralMode && Math.random() < spiralProbability && i < numberOfBranches-4) {
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

			// Leaves generated on magic branchThe i < 7 is here to prevent leaves overlapping the magic seed
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

	const trunkNumberOfBranches = 25;
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
	}

	let allTheBranches = generateBranches({
		numberOfBranches: trunkNumberOfBranches,
		depth: initialDepth,
		baseId: '',
		branchAngleLimitation: 10,
		initialBranchAngle: 0,
		initialBranchWidth: 40,
		initialBranchLength: 40,
		angleDecrementFactor: 0.75,
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
</script>

<div class="outer-container">
	<div class="central" class:expanded>
		<BoxWithTarget
			{expanded}
			{toggleExpanded}
			on:triggerRain={handleRainTriggering}
			{oldMagicSeedWasClicked}
		>
			<Nuage slot="boxTarget" />
			<Rain
				slot="appearsWhenBoxInBoxTarget"
				top="40%"
				width="80%"
				left="3%"
				rainGround="75vh"
				rainColor="rgba(176, 224, 230, 0.2)"
			/>
			<Tree slot="treeSlot" leftPosition="50%" treeGround="80vh" {isFirstBranchGrowing} {allTheBranches} on:branchMagicSeedWasClicked={handleMagicSeedClick} />
			<MagicSeed slot="magicSeedSlot" growing=true rotation=0 parentLength=0 />
		</BoxWithTarget>
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
		width: 100vw;
		height: 100vh;
	}

	.central {
		display: flex;
		justify-content: center;
		align-items: center;
		font-size: 1.5em;
		transition: all 0.5s ease-in-out;
	}

	.central.expanded {
		width: calc(100vh * var(--aspect-ratio));
		height: 100vh;
		background-color: azure;
		max-width: 100vw;
		max-height: 100vh;
	}
</style>
