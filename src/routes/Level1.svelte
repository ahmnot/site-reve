<script>
	import '../global.css';
	import { onMount } from 'svelte';
	import Rain from './Rain.svelte';
	import Matter from 'matter-js';
	import Tree from './Tree.svelte';

	let rainColor = 'rgba(176, 224, 230, 0.5)';
	let isRaining = false;
	let expanded = false;
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
				isRaining = false;
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

	let leftPosition = '50%';

	let rainGround = '70vh'; // La position du sol de la pluie

	let isFirstBranchGrowing = false;

// Function to generate branches with alternating 90/-90 degree angles
function generateBranches(numBranches, depth = 3) {
	const branches = [];
	let initialLength = 10; // Initial length of the first branch
	let currentLength = initialLength;
	let currentDirection = 0;
	let lengthDecrementFactor = 0.98; // Factor to decrement the length exponentially
	let inSpiralMode = false; // Flag to track spiral mode
	let leafProbability = 0.2; // Probability of creating a leaf
	let spiralProbability = 0.05;
	let branchOnBranchProbability = 0.01; // Probability of creating a branch on an existing branch

	function createBranch(id, length, direction, color = 'darkgoldenrod') {
		return {
			id: id,
			length: `${length}vw`,
			direction: `${direction}deg`,
			color: color,
			branches: []
		};
	}

	function createLeaf(parentId) {
		return {
			id: `${parentId}-side`,
			length: `15px`,
			direction: `${Math.random() < 0.5 ? 90 : -90}deg`,
			color: 'forestgreen',
			branches: []
		};
	}

	let parentBranch = createBranch(1, currentLength, currentDirection);
	branches.push(parentBranch);

	for (let i = 2; i <= numBranches; i++) {
		currentLength *= lengthDecrementFactor; 
		let currentDirection;
		if (i <= 5) {
			currentDirection = i % 2 === 0 ? 90 : -90;
		} else {
			if (i <= 9) {
				currentDirection = i % 2 === 0 ? -90 : 90;
			} else {
				if (Math.random() < spiralProbability) {
					inSpiralMode = !inSpiralMode;
				}

				if (inSpiralMode) {
					currentDirection = 90;
				} else {
					currentDirection = Math.random() < 0.5 ? 90 : -90;
				}
			}
		}

		const newBranch = createBranch(i, currentLength, currentDirection);
		parentBranch.branches.push(newBranch);

		// Occasionally create a side branch
		if (Math.random() < leafProbability) {
			const sideBranch = createLeaf(newBranch.id);
			newBranch.branches.push(sideBranch);
		}

		// Occasionally create a new set of branches on an existing branch
		if (depth > 0 && Math.random() < branchOnBranchProbability) {
			newBranch.branches.push(...generateBranches(Math.floor(numBranches / 2), depth - 1));
		}

		// Update the parentBranch to the newly created branch
		parentBranch = newBranch;
	}

	return branches;
}

let branches = generateBranches(200);
</script>

<div class="outer-container">
	<div class="central" class:expanded>
		<div id="cloud" class:hidden={!expanded}>
			☁️
			{#if isRaining}
				<Rain top="45%" width="80%" left="5%" {rainGround} {rainColor} />
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
		width: 100px;
		display: flex;
		justify-content: center;
		font-size: 5em;
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
