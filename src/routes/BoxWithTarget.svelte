<script>
	import { onMount, createEventDispatcher } from 'svelte';
	import Matter from 'matter-js';

	export let isEventTriggered;
	export let expanded;
	export let toggleExpanded;

	const dispatch = createEventDispatcher();

	let engine;
	let box;
	let isGrabbing = false;
	let ground, leftWall, rightWall, ceiling;

	$: if (expanded && box && engine) {
		Matter.Body.setStatic(box.body, false);
		engine.gravity.y = 1;
	}

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

		const targetElem = document.querySelector('#target');

		const render = () => {
			const boxPos = box.body.position;
			const targetPos = targetElem.getBoundingClientRect();
			const targetCenter = {
				x: targetPos.left + targetPos.width / 2,
				y: targetPos.top + targetPos.height / 2
			};

			const distance = Math.sqrt(
				Math.pow(boxPos.x - targetCenter.x, 2) + Math.pow(boxPos.y - targetCenter.y, 2)
			);

			if (distance < 50) {
				Matter.Body.setPosition(box.body, targetCenter);
				Matter.Body.setVelocity(box.body, { x: 0, y: 0 });
				Matter.Body.setAngularVelocity(box.body, 0);
				isEventTriggered = true;
				dispatch('triggerEvent');
			} else {
				isEventTriggered = false;
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
</script>

<div id="target" class:hidden={!expanded}>
	<slot name="boxTarget"></slot>
	{#if isEventTriggered}
		<slot name="appearsWhenBoxInBoxTarget"></slot>
	{/if}
	<!-- slot for the tree -->
	<slot></slot>
</div>

<button id="box" on:click={toggleExpanded}>{expanded ? 'pluie' : 'rêve'}</button>

<style>
	:root {
		--aspect-ratio: calc(9 / 16);
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
</style>
