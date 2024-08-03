<script>
	import '../global.css';
	import { onMount } from 'svelte';
	import Rain from './Rain.svelte';
	import Matter from 'matter-js';
	import Tree from './Tree.svelte';
	import Nuage from './Nuage.svelte';

	let isRaining = false;
	let expanded = true;
	let engine;
	let box;
	let isFirstClick = true;
	let isGrabbing = false;
	let ground, leftWall, rightWall, ceiling;

	onMount(() => {
		engine = Matter.Engine.create();
		engine.gravity.y = 0.002;

		const boxBody = Matter.Bodies.rectangle(window.innerWidth / 2, window.innerHeight / 2, 50, 50);

		ground = Matter.Bodies.rectangle(
			window.innerWidth / 2,
			window.innerHeight + 10,
			window.innerWidth,
			20,
			{ isStatic: true }
		);
		leftWall = Matter.Bodies.rectangle(-10, window.innerHeight / 2, 20, window.innerHeight, {
			isStatic: true
		});
		rightWall = Matter.Bodies.rectangle(
			window.innerWidth + 10,
			window.innerHeight / 2,
			20,
			window.innerHeight,
			{ isStatic: true }
		);
		ceiling = Matter.Bodies.rectangle(window.innerWidth / 2, -10, window.innerWidth, 20, {
			isStatic: true
		});

		const mouse = Matter.Mouse.create(document.body);
		const mouseConstraint = Matter.MouseConstraint.create(engine, {
			mouse: mouse,
			constraint: {
				render: { visible: false },
				stiffness: 0.8
			}
		});

		Matter.Composite.add(engine.world, [
			boxBody,
			ground,
			leftWall,
			rightWall,
			ceiling,
			mouseConstraint
		]);

		box = {
			body: boxBody,
			elem: document.querySelector('#box'),
			render() {
				const { x, y } = this.body.position;
				this.elem.style.top = `${y - 25}px`;
				this.elem.style.left = `${x - 25}px`;
				this.elem.style.transform = `rotate(${this.body.angle}rad)`;
			}
		};

		const updateBoundaries = () => {
			Matter.Body.setPosition(ground, { x: window.innerWidth / 2, y: window.innerHeight + 10 });
			Matter.Body.setPosition(leftWall, { x: -10, y: window.innerHeight / 2 });
			Matter.Body.setPosition(rightWall, { x: window.innerWidth + 10, y: window.innerHeight / 2 });
			Matter.Body.setPosition(ceiling, { x: window.innerWidth / 2, y: -10 });

			Matter.Body.setVertices(ground, [
				{ x: 0, y: window.innerHeight },
				{ x: window.innerWidth, y: window.innerHeight },
				{ x: window.innerWidth, y: window.innerHeight + 20 },
				{ x: 0, y: window.innerHeight + 20 }
			]);

			Matter.Body.setVertices(leftWall, [
				{ x: -20, y: 0 },
				{ x: 0, y: 0 },
				{ x: 0, y: window.innerHeight },
				{ x: -20, y: window.innerHeight }
			]);

			Matter.Body.setVertices(rightWall, [
				{ x: window.innerWidth, y: 0 },
				{ x: window.innerWidth + 20, y: 0 },
				{ x: window.innerWidth + 20, y: window.innerHeight },
				{ x: window.innerWidth, y: window.innerHeight }
			]);

			Matter.Body.setVertices(ceiling, [
				{ x: 0, y: -20 },
				{ x: window.innerWidth, y: -20 },
				{ x: window.innerWidth, y: 0 },
				{ x: 0, y: 0 }
			]);
		};

		window.addEventListener('resize', updateBoundaries);

		const cloudElem = document.querySelector('#cloud');

		const render = () => {
			const boxPos = box.body.position;
			const cloudPos = cloudElem.getBoundingClientRect();
			const cloudCenter = {
				x: cloudPos.left + cloudPos.width / 1.9,
				y: cloudPos.top + cloudPos.height / 1.65
			};

			const distance = Math.sqrt(
				Math.pow(boxPos.x - cloudCenter.x, 2) + Math.pow(boxPos.y - cloudCenter.y, 2)
			);

			if (distance < 50) {
				Matter.Body.setPosition(box.body, cloudCenter);
				Matter.Body.setVelocity(box.body, { x: 0, y: 0 });
				Matter.Body.setAngularVelocity(box.body, 0);
				isRaining = true;
				setInterval(() => (isFirstBranchGrowing = true), 1000);
			} else {
				isRaining = false;
			}

			box.render();
			Matter.Engine.update(engine);
			requestAnimationFrame(render);
		};

		render();

		const boxElem = document.querySelector('#box');

		const handleMouseUp = () => {
			isGrabbing = false;
			boxElem.style.cursor = 'grab';
			document.body.style.cursor = 'default';
			document.removeEventListener('mousemove', handleMouseMove);
			document.removeEventListener('mouseup', handleMouseUp);
		};

		const handleMouseMove = () => {
			if (isGrabbing) {
				boxElem.style.cursor = 'grabbing';
				document.body.style.cursor = 'grabbing';
			}
		};

		boxElem.addEventListener('mousedown', () => {
			isGrabbing = true;
			boxElem.style.cursor = 'grabbing';
			document.body.style.cursor = 'grabbing';
			document.addEventListener('mousemove', handleMouseMove);
			document.addEventListener('mouseup', handleMouseUp);
		});
	});

	function toggleExpanded() {
		if (isFirstClick) {
			expanded = true;
			isFirstClick = false;
			box.elem.style.cursor = 'grab';
		}
		Matter.Body.setStatic(box.body, false);
		engine.gravity.y = 1;
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

	// Unique ID generator using a counter
	let idCounter = 0;
	function generateUniqueId(prefix = '') {
		idCounter += 1;
		return `${prefix}-${idCounter}`;
	}

	let leftPosition = '50%';

	let isFirstBranchGrowing = false;

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
					length: `${getRandomValue(14, 15)}px`,
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

	let rainGround = '70vh'; // La position du sol de la pluie
</script>

<div class="outer-container">
	<div class="central" class:expanded>
		<div id="cloud" class:hidden={!expanded}>
			<Nuage />
			{#if isRaining}
				<Rain top="40%" width="80%" left="3%" {rainGround} rainColor="rgba(176, 224, 230, 0.2)" />
			{/if}

			<Tree {leftPosition} treeGround={rainGround} {isFirstBranchGrowing} {allTheBranches} />
		</div>
		<button id="box" on:click={toggleExpanded}>{expanded ? 'pluie' : 'rêve'}</button>
	</div>
</div>

<style>
	#cloud {
		position: relative;
		top: -40%;
		left: -25%;
		display: flex;
		justify-content: center;
		transition: opacity 0.2s ease-in-out;
		user-select: none;
	}

	.hidden {
		opacity: 0;
	}

	:root {
		--aspect-ratio: calc(9 / 16);
		overflow: hidden;
	}

	#box {
		position: absolute;
		height: 50px;
		width: 50px;
		display: flex;
		align-items: center;
		justify-content: center;
		user-select: none;
		overflow: hidden;
		cursor: pointer;
		font-family: 'Minecraft', sans-serif;
		font-size: 0.8em;
		border: none;
		background: none;
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
