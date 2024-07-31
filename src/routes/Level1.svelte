<script>
	import '../global.css';
	import { onMount } from 'svelte';
	import Rain from './Rain.svelte';
	import Matter from 'matter-js';
	import Tree from './Tree.svelte';
	import Nuage from './Nuage.svelte';

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

	// Function to generate branches with alternating degree angles
	function generateBranches(numBranches, depth = 3, baseId = '', baseBranchAngle = 0) {
		const branches = [];
		let initialLength = 40; // Initial length of the first branch
		let currentLength = initialLength;
		let rotationToAdd = baseBranchAngle;
		let lengthDecrementFactor = 0.98; // Factor to decrement the length exponentially
		let inSpiralMode = false; // Flag to track spiral mode
		let leafProbability = 0.2; // Probability of creating a leaf
		let spiralProbability = 0.05;
		let branchOnBranchProbability = 0.01; // Probability of creating a branch on an existing branch
		let flowerProbability = 0.005;

		function createBranch(
			id,
			length,
			direction,
			color = 'darkgoldenrod'
		) {
			return {
				id: id,
				length: `${length}px`,
				direction: `${direction}deg`,
				absoluteAngle,
				rotationToAdd,
				color: color,
				branches: []
			};
		}

		function createLeaf(parentId, color = 'forestgreen', length = '15px') {
			const uniqueId = `${parentId}-leaf-${Math.random().toString(36).substr(2, 9)}`;
			return {
				id: uniqueId,
				length,
				direction: `${Math.random() < 0.5 ? 90 : -90}deg`,
				color,
				branches: []
			};
		}

		let absoluteAngle = 0;

		let parentBranch = createBranch(
			`${baseId}-1`,
			currentLength,
			rotationToAdd
		);
		branches.push(parentBranch);

		for (let i = 2; i <= numBranches; i++) {
			currentLength *= lengthDecrementFactor;
			let rotationToAdd;

			if (i <= 9) {
				rotationToAdd = i % 2 === 0 ? 90 : -90;
			} else {
				if (i <= 15) {
					switch (i) {
						case 10:
							rotationToAdd = 0;
							break;
						case 11:
							rotationToAdd = 0;
							break;
						case 12:
							rotationToAdd = Math.random() < 0.5 ? -22.5 : -11.25;
							break;
						case 13:
							rotationToAdd = 0;
							break;
						case 14:
							rotationToAdd = 0;
							break;
						case 15:
							rotationToAdd = 20;
							break;
						default:
							break;
					}
				} else {
					if (Math.random() < spiralProbability) {
						inSpiralMode = !inSpiralMode;
					}

					if (inSpiralMode) {
						rotationToAdd = 90;
					} else {
						rotationToAdd = Math.random() < 0.5 ? 45 : -45;
					}
				}
			}

			// Controle de la direction générale de la branche
			if (Math.abs(absoluteAngle + rotationToAdd) > 90) {
				rotationToAdd = 0;
			}

			absoluteAngle += rotationToAdd;
			absoluteAngle %= 360;

			const newBranch = createBranch(
				`${baseId}-${i}`,
				currentLength,
				rotationToAdd
			);

			parentBranch.branches.push(newBranch);

			// Occasionally create a leaf
			if (Math.random() < leafProbability) {
				const sideBranch = createLeaf(newBranch.id);
				newBranch.branches.push(sideBranch);
			}

			// Occasionally create a gold flower
			if (Math.random() < flowerProbability) {
				const sideBranch = createLeaf(newBranch.id, 'palegoldenrod', '12px');
				newBranch.branches.push(sideBranch);
			}

			// Occasionally create a new set of branches on an existing branch
			if (depth > 0 && Math.random() < branchOnBranchProbability) {
				newBranch.branches.push(
					...generateBranches(
						Math.floor(numBranches / 2),
						depth - 1,
						`${baseId}-${i}`,
						absoluteAngle
					)
				);
			}

			// Update the parentBranch to the newly created branch
			parentBranch = newBranch;

			// Ensure the last branch has a colord leaf
			if (i === numBranches) {
				const coloredLeaf = createLeaf(
					newBranch.id,
					Math.random() < 0.5 ? 'thistle' : 'mistyrose',
					'12px'
				);
				newBranch.branches.push(coloredLeaf);
			}
		}

		return branches;
	}

	let branches = generateBranches(200);
</script>

<div class="outer-container">
	<div class="central" class:expanded>
		<div id="cloud" class:hidden={!expanded}>
			<Nuage />
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
