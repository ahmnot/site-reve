<script>
	import { onMount, createEventDispatcher } from 'svelte';
	import { magicSeedPositionWritable } from '../lib/magicSeedPositionStore.js';

	let oldMagicSeedPosition;

	// Subscribe to the store to get the position
	magicSeedPositionWritable.subscribe((value) => {
		oldMagicSeedPosition = value;
	});

	import Matter from 'matter-js';

	export let isRainTriggered;
	export let expanded;
	export let toggleExpanded;

	export let oldMagicSeedWasClicked;

	let newMagicSeedElem;

	const dispatch = createEventDispatcher();

	let box;
	let newMagicSeed;
	let isGrabbing = false;
	let ground, leftWall, rightWall, ceiling;
	let engine;

	let magicSeedHasHitGround = false;

	$: if (expanded && box && engine) {
		Matter.Body.setStatic(box.body, false);
		Matter.Body.setStatic(newMagicSeed.body, true);
		engine.gravity.y = 1;
	}

	let timeSinceNewMagicSeedVisible = 0;

	onMount(() => {
		engine = Matter.Engine.create();
		engine.gravity.y = 0.001;

		const boxBody = Matter.Bodies.rectangle(window.innerWidth / 2, window.innerHeight / 2, 50, 50);
		const newMagicSeedBody = Matter.Bodies.rectangle(
			window.innerWidth / 4,
			window.innerHeight / 2,
			50,
			50
		);

		ground = Matter.Bodies.rectangle(
			window.innerWidth / 2,
			window.innerHeight - 40,
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
			newMagicSeedBody,
			ground,
			leftWall,
			rightWall,
			ceiling,
			mouseConstraint
		]);

		const boxElem = document.querySelector('#box');

		box = {
			body: boxBody,
			elem: boxElem,
			render() {
				const { x, y } = this.body.position;
				this.elem.style.top = `${y - 25}px`;
				this.elem.style.left = `${x - 25}px`;
				this.elem.style.transform = `rotate(${this.body.angle}rad)`;
			}
		};

		newMagicSeedElem = document.querySelector('#newMagicSeed');

		newMagicSeed = {
			body: newMagicSeedBody,
			elem: newMagicSeedElem,
			render() {
				const { x, y } = this.body.position;
				this.elem.style.top = `${y - 25}px`;
				this.elem.style.left = `${x - 25}px`;
				this.elem.style.transform = `rotate(${this.body.angle}rad)`;
			}
		};

		newMagicSeed.body.frictionAir = 0.02;

		// Make the newMagicSeed lighter
		Matter.Body.setDensity(newMagicSeed.body, 0.001);

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

		const targetElem = document.querySelector('#target');

		const render = () => {
			if (newMagicSeedElem.style.visibility === 'visible') {
				timeSinceNewMagicSeedVisible++;
			}
			const boxPos = box.body.position;
			const targetPos = targetElem.getBoundingClientRect();
			const targetCenter = {
				x: targetPos.left + targetPos.width / 2,
				y: targetPos.top + targetPos.height / 2 + 7
			};

			const distance = Math.sqrt(
				Math.pow(boxPos.x - targetCenter.x, 2) + Math.pow(boxPos.y - targetCenter.y, 2)
			);

			if (distance < 50) {
				Matter.Body.setPosition(box.body, targetCenter);
				Matter.Body.setVelocity(box.body, { x: 0, y: 0 });
				Matter.Body.setAngularVelocity(box.body, 0);
				isRainTriggered = true;
				dispatch('triggerRain');
			} else {
				isRainTriggered = false;
			}

			// Increase the angular velocity over time
			if (!magicSeedHasHitGround && newMagicSeed && !newMagicSeed.body.isStatic) {
				const currentAngularVelocity = newMagicSeed.body.angularVelocity;
				if (timeSinceNewMagicSeedVisible<=50) {
					Matter.Body.setAngularVelocity(newMagicSeed.body, currentAngularVelocity + 0.0005);
				}
				if (timeSinceNewMagicSeedVisible>40) {
					Matter.Body.setAngularVelocity(newMagicSeed.body, currentAngularVelocity + 0.01);
				}

				Matter.Body.applyForce(newMagicSeed.body, newMagicSeed.body.position, {
					x: 0.0006, 
					y: -0.001
				});

			}

			box.render();
			newMagicSeed.render();
			Matter.Engine.update(engine);
			requestAnimationFrame(render);

			if (timeSinceNewMagicSeedVisible>1000) {
				timeSinceNewMagicSeedVisible=0;
			}
		};

		render();

		const handleMouseUp = () => {
			isGrabbing = false;
			boxElem.style.cursor = 'grab';
			newMagicSeedElem.style.cursor = 'grab';
			document.body.style.cursor = 'default';
			document.removeEventListener('mousemove', handleMouseMove);
			document.removeEventListener('mouseup', handleMouseUp);
		};

		const handleMouseMove = () => {
			if (isGrabbing) {
				boxElem.style.cursor = 'grabbing';
				newMagicSeedElem.style.cursor = 'grabbing';
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

		newMagicSeedElem.addEventListener('mousedown', () => {
			isGrabbing = true;
			newMagicSeedElem.style.cursor = 'grabbing';
			document.body.style.cursor = 'grabbing';
			document.addEventListener('mousemove', handleMouseMove);
			document.addEventListener('mouseup', handleMouseUp);
		});

		Matter.Events.on(engine, 'collisionStart', function (event) {
			event.pairs.forEach((pair) => {
				const { bodyA, bodyB } = pair;
				if (
					(bodyA === newMagicSeed.body && bodyB === ground) ||
					(bodyB === newMagicSeed.body && bodyA === ground)
				) {
					magicSeedHasHitGround = true;
				}
			});
		});
	});

	$: if (oldMagicSeedWasClicked) {
		if (oldMagicSeedPosition && newMagicSeed) {
			const newPosition = {
				x: oldMagicSeedPosition.left + 25, // Adjusting for the center of the seed + 10 because of animation
				y: oldMagicSeedPosition.top + 25 // Adjusting for the center of the seed
			};
			Matter.Body.setPosition(newMagicSeed.body, newPosition);

			// Convert degrees (+ 90 because of hologram animation) to radians
			const angleInRadians = ((oldMagicSeedPosition.angle + 90) * Math.PI) / 180;
			Matter.Body.setAngle(newMagicSeed.body, angleInRadians);
			Matter.Body.setStatic(newMagicSeed.body, false);

			newMagicSeedElem.style.visibility = 'visible';
		}
	}
</script>

<div id="target" class:hidden={!expanded}>
	<slot name="boxTarget"></slot>
	{#if isRainTriggered}
		<slot name="appearsWhenBoxInBoxTarget"></slot>
	{/if}
	<!-- slot for the tree -->
	<slot name="treeSlot"></slot>
</div>

<button id="box" on:click={toggleExpanded}>{expanded ? 'pluie' : 'rêve'}</button>

<button id="newMagicSeed"><slot name="magicSeedSlot"></slot></button>

<style>
	:root {
		overflow: hidden;
	}

	#target {
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

	#newMagicSeed {
		position: absolute;
		height: 50px;
		width: 50px;
		display: flex;
		align-items: center;
		justify-content: center;
		user-select: none;
		overflow: hidden;
		cursor: pointer;
		border: none;
		visibility: hidden;
	}
</style>
