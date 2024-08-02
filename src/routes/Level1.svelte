<script>
	import '../global.css';
	import { onMount } from 'svelte';
	import Rain from './Rain.svelte';
	import Matter from 'matter-js';
	import Tree from './Tree.svelte';
	import Nuage from './Nuage.svelte';

	let isRaining = true;
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

		const mouseConstraint = Matter.MouseConstraint.create(engine, { element: document.body });

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
				isRaining = true;
			}

			box.render();
			Matter.Engine.update(engine);
			requestAnimationFrame(render);
		};

		render();
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

	let leftPosition = '50%';

	let isFirstBranchGrowing = true;

	// Function to generate a tree with alternating degree angles
	function generateBranches(config) {
		const {
			numberOfBranches = 40,
			depth = 3,
			baseId = '',
			branchAngleLimitation = 5,
			initialBranchAngle = 0,
			initialBranchWidth = 40,
			initialBranchLength = 40,
			angleDecrementFactor = 0.98,
			widthDecrementFactor = 0.9,
			lengthDecrementFactor = 0.97,
			leafProbability = 0,
			spiralProbability = 0.01,
			initialBranchOnBranchProbability = 0.8,
			branchOnBranchProbabilityDecrementFactor = 0.98,
			sideFlowerProbability = 0.005
		} = config;

		const branches = [];

		let rotationToAdd = initialBranchAngle;
		let currentWidth = initialBranchWidth;
		let currentLength = initialBranchLength;

		let currentBranchOnBranchProbability = initialBranchOnBranchProbability;

		let inSpiralMode = false; // Flag to track spiral mode

		let absoluteAngle = 0;

		let parentBranch = {
			id: `${baseId}-1`,
			width: `${currentWidth}px`,
			length: `${currentLength}px`,
			rotation: `${rotationToAdd}deg`,
			absoluteAngle,
			rotationToAdd,
			color: 'tan',
			branches: []
		};

		branches.push(parentBranch);

		let spirallingCount = 0;

		for (let i = 2; i <= numberOfBranches; i++) {
			currentWidth *= widthDecrementFactor;
			currentLength *= lengthDecrementFactor;

			currentBranchOnBranchProbability *= branchOnBranchProbabilityDecrementFactor;

			if (i <= 3) {
				rotationToAdd = i % 2 === 0 ? 90 : -90;
			} else {
				rotationToAdd = getRandomValueWithSign([2.8125, 5.625, 11.25, 22.5, 45, 90]);
			}

			// Control the general direction of the branch
			if (Math.abs(absoluteAngle + rotationToAdd) > branchAngleLimitation) {
				rotationToAdd = 0;
			}

			if (!inSpiralMode && Math.random() < spiralProbability) {
				inSpiralMode = true;
				spirallingCount = 0; // Reset the spiral counter
			}

			if (inSpiralMode) {
				rotationToAdd = 90;
				spirallingCount++;
				if (spirallingCount >= 4) {
					inSpiralMode = false; // Exit spiral mode after 4 branches
				}
			} else {
				rotationToAdd *= angleDecrementFactor;
			}

			absoluteAngle += rotationToAdd;
			absoluteAngle %= 360;

			const newBranch = {
				id: `${baseId}-${i}`,
				zIndex: 0,
				width: `${currentWidth}px`,
				length: `${currentLength}px`,
				rotation: `${rotationToAdd}deg`,
				absoluteAngle,
				rotationToAdd,
				color: 'tan',
				branches: []
			};

			parentBranch.branches.push(newBranch);

			if (Math.random() < leafProbability) {
				newBranch.branches.push({
					id: `${newBranch.id}-leaf-${Math.random().toString(36).substr(2, 9)}`,
					zIndex: 999,
					width: `${getRandomValue(8, 10)}px`,
					length: `${getRandomValue(14, 15)}px`,
					rotation: `${Math.random() < 0.5 ? 90 : -90}deg`,
					color: 'forestgreen',
					branches: []
				});
			}

			if (Math.random() < sideFlowerProbability) {
				newBranch.branches.push({
					id: `${newBranch.id}-flower-${Math.random().toString(36).substr(2, 9)}`,
					width: `${getRandomValue(8, 10)}px`,
					length: `${getRandomValue(8, 15)}px`,
					rotation: `${Math.random() < 0.5 ? 90 : -90}deg`,
					color: 'palegoldenrod',
					branches: []
				});
			}

			let newSetOfBranchesAngle =
				-absoluteAngle + getRandomValueWithSign([10, 20, 45].map((a) => a * angleDecrementFactor));

			if (depth > 0 && Math.random() < currentBranchOnBranchProbability) {
				newBranch.branches.push(
					...generateBranches({
						numberOfBranches: Math.floor(numberOfBranches / 2),
						depth: depth - 1,
						baseId: `${baseId}-${i}`,
						branchAngleLimitation: 10,
						initialBranchAngle: newSetOfBranchesAngle,
						initialBranchWidth: 10,
						initialBranchLength: 20,
						angleDecrementFactor: 0.98,
						lengthDecrementFactor: 0.95,
						widthDecrementFactor: 0.85,
						leafProbability: 0.95,
						spiralProbability: 0.15,
						initialBranchOnBranchProbability: 0.01,
						branchOnBranchProbabilityDecrementFactor: 0.5,
						sideFlowerProbability: 0.015
					})
				);
			}

			parentBranch = newBranch;

			if (i === numberOfBranches) {
				newBranch.branches.push({
					id: `${newBranch.id}-leaf-${Math.random().toString(36).substr(2, 9)}`,
					width: '10px',
					length: '12px',
					rotation: `${Math.random() < 0.5 ? 90 : -90}deg`,
					color: Math.random() < 0.5 ? 'thistle' : 'mistyrose',
					branches: []
				});
			}
		}

		return branches;
	}
	let branches = generateBranches({
		numberOfBranches: 30,
		depth: 4,
		baseId: '',
		branchAngleLimitation: 45,
		initialBranchAngle: 0,
		initialBranchWidth: 40,
		initialBranchLength: 40,
		angleDecrementFactor: 0.75,
		widthDecrementFactor: 0.9,
		lengthDecrementFactor: 0.97,
		leafProbability: 0,
		spiralProbability: 0.01,
		initialBranchOnBranchProbability: 0.4,
		branchOnBranchProbabilityDecrementFactor: 1.05,
		sideFlowerProbability: 0.005
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

			<Tree {leftPosition} treeGround={rainGround} {isFirstBranchGrowing} {branches} />
		</div>
		<div id="box" on:click={toggleExpanded}>{expanded ? 'pluie' : 'rêve'}</div>
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
