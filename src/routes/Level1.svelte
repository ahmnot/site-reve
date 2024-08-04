<script>
	import '../global.css';
	import Tree from './Tree.svelte';
	import BoxWithTarget from './BoxWithTarget.svelte';
	import Rain from './Rain.svelte';
	import Nuage from './Nuage.svelte';

	let isRaining = false;
	let expanded = true;
	let isFirstClick = true;
	let isFirstBranchGrowing = false;

	function toggleExpanded() {
		if (isFirstClick) {
			expanded = true;
			isFirstClick = false;
		}
	}

	function handleStartBranchGrowing() {
		isFirstBranchGrowing = true;
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

	// Global flag to ensure the magic flower is generated only once
	let magicFlowerGenerated = false;

	const trunkNumberOfBranches = 25;
	const initialDepth = 4;

	let trunkBranchPosition = 0;

	let newSetOfBranchesAngle;

	// Function to generate a tree with alternating degree angles
	function generateBranches(config) {
		const {
			numberOfBranches = trunkNumberOfBranches,
			depth = initialDepth,
			baseId = '',
			branchAngleLimitation = 5,
			initialBranchAngle = 0,
			initialBranchWidth = 40,
			initialBranchLength = 40,
			angleDecrementFactor = 0.98,
			widthDecrementFactor = 0.9,
			lengthDecrementFactor = 0.97,
			leafProbability = 0,
			spiralProbability = 0,
			initialBranchOnBranchProbability = 0.8,
			branchOnBranchProbabilityDecrementFactor = 0.98
		} = config;

		const finalBranches = [];
		let rotationToAdd = initialBranchAngle;
		let currentWidth = initialBranchWidth;
		let currentLength = initialBranchLength;
		let currentBranchOnBranchProbability = initialBranchOnBranchProbability;
		let inSpiralMode = false;
		let absoluteAngle = 0;
		let spirallingCount = 0;

		let magicFlowerCondition =
			depth == initialDepth - 1 &&
			!magicFlowerGenerated &&
			trunkBranchPosition > Math.floor((2 * trunkNumberOfBranches) / 3) - 2;

		let parentBranch = {
			id: generateUniqueId(baseId),
			zIndex: magicFlowerCondition ? 999 : 0,
			width: `${currentWidth}px`,
			length: magicFlowerCondition ? '4vw' : `${currentLength}px`,
			rotation: magicFlowerCondition ? '90deg' : `${rotationToAdd}deg`,
			color: 'tan',
			windIntensity: 0,
			childBranches: []
		};

		finalBranches.push(parentBranch);

		for (let i = 0; i < numberOfBranches; i++) {
			if (depth == initialDepth) {
				trunkBranchPosition = i;
			}

			currentWidth *= widthDecrementFactor;
			currentLength *= lengthDecrementFactor;
			currentBranchOnBranchProbability *= branchOnBranchProbabilityDecrementFactor;

			rotationToAdd = getRandomValueWithSign([2.8125, 5.625, 11.25, 22.5, 45, 90]);

			// Control the general direction of the branch
			if (Math.abs(absoluteAngle + rotationToAdd) > branchAngleLimitation) {
				rotationToAdd = 0;
			}

			if (!inSpiralMode && Math.random() < spiralProbability) {
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

			const childBranch = {
				id: generateUniqueId(baseId),
				zIndex: 5,
				width: `${currentWidth}px`,
				length: `${currentLength}px`,
				rotation: `${rotationToAdd}deg`,
				color: 'tan',
				windIntensity: 2 / (widthDecrementFactor * 0.9),
				childBranches: []
			};

			// Generate the magic flower on a special branch at approximately at 2/3 of the main branch, on the tip of that branch
			if (magicFlowerCondition && i == numberOfBranches - 1) {
				childBranch.childBranches.push({
					id: generateUniqueId(`${childBranch.id}-flower`),
					zIndex: 999,
					width: '40px',
					length: '40px',
					rotation: `0deg`,
					holographic: true,
					windIntensity: 2 / (widthDecrementFactor * 0.9),
					childBranches: []
				});
				magicFlowerGenerated = true;
			}

			// The i < 7 is here to prevent leaves overlapping the magic flower
			if (magicFlowerCondition && i < 7) {
				childBranch.childBranches.push({
					id: generateUniqueId(`${childBranch.id}-leaf`),
					zIndex: 50,
					width: `${getRandomValue(8, 10)}px`,
					length: `${getRandomValue(14, 15)}px`,
					rotation: `${Math.random() < 0.5 ? 90 : -90}deg`,
					color: 'forestgreen',
					windIntensity: 1 / (widthDecrementFactor * 0.9),
					childBranches: []
				});
			}

			parentBranch.childBranches.push(childBranch);

			// Generating leaves when not on magic flower branch
			if (!magicFlowerCondition && Math.random() < leafProbability) {
				childBranch.childBranches.push({
					id: generateUniqueId(`${childBranch.id}-leaf`),
					zIndex: 100,
					width: `${getRandomValue(8, 10)}px`,
					length: `${getRandomValue(12, 15)}px`,
					rotation: `${Math.random() < 0.5 ? 90 : -90}deg`,
					color: 'forestgreen',
					windIntensity: 2 / (widthDecrementFactor * 0.9),
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
						branchAngleLimitation: 10,
						initialBranchAngle: newSetOfBranchesAngle,
						initialBranchWidth: 5,
						initialBranchLength: 20,
						angleDecrementFactor: 0.98,
						lengthDecrementFactor: 0.95,
						widthDecrementFactor: 0.85,
						leafProbability: 0.98,
						spiralProbability: 0.1,
						initialBranchOnBranchProbability: 0.02,
						branchOnBranchProbabilityDecrementFactor: 0.5
					})
				);
			}

			parentBranch = childBranch;

			if (i === numberOfBranches - 2 && !magicFlowerCondition) {
				childBranch.childBranches.push({
					id: generateUniqueId(`${childBranch.id}-leaf`),
					zIndex: 100,
					width: '10px',
					length: '12px',
					rotation: `-90deg`,
					color: Math.random() < 0.5 ? 'thistle' : 'mistyrose',
					childBranches: []
				});
			}
		}

		return finalBranches;
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
		initialBranchOnBranchProbability: 0.3,
		branchOnBranchProbabilityDecrementFactor: 1.1
	});
</script>

<div class="outer-container">
	<div class="central" class:expanded>
		<BoxWithTarget {isRaining} {expanded} toggleExpanded={toggleExpanded} on:triggerEvent={handleStartBranchGrowing}>
			<Nuage slot="boxTarget" />
			<Rain slot="appearsWhenBoxInBoxTarget" top="40%" width="80%" left="3%" rainGround="75vh" rainColor="rgba(176, 224, 230, 0.2)" />
			<Tree leftPosition='50%' treeGround="75vh" {isFirstBranchGrowing} {allTheBranches} />
		</BoxWithTarget>
	</div>
</div>

<style>
	:root {
		--aspect-ratio: calc(9 / 16);
		overflow: hidden;
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
		width: calc(33vh * var(--aspect-ratio));
		height: 33vh;
		max-width: calc(100vh * var(--aspect-ratio));
		max-height: 100vh;
		background-color: floralwhite;
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
