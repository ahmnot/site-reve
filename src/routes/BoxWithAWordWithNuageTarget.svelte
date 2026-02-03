<script>
	// BoxWithAWordWithNuageTarget.svelte
	import { onMount } from 'svelte';
	import { magicSeedPositionWritable } from '../lib/magicSeedPositionStore.js';
	import { isRainTriggered } from '../lib/rainStore.js';
	import {
		isMagicSeedBloomTriggered,
		magicSeedBloomLeftOffset,
		magicSeedBloomBottomOffset
	} from '../lib/magicSeedBloomStore.js';
	import { shouldFadeOutWebGLSeed } from '../lib/magicSeedFadeStore.js';
	import { physicsSyncStore } from '../lib/physicsSyncStore.js';

	let oldMagicSeedPosition;
	let isMobile;

	magicSeedPositionWritable.subscribe((value) => {
		oldMagicSeedPosition = value;
	});

	import Matter from 'matter-js';

	export let expanded;
	export let toggleExpanded;
	export let oldMagicSeedWasClicked;
	export let isCloudAndRainHidden = false;
	export let isRestoringFromSession = false;

	let newMagicSeedElem;
	let boxWithAWord;
	let newMagicSeed;
	let isGrabbing = false;
	let ground, leftWall, rightWall, ceiling;
	let engine;

	let magicSeedHasHitGround = false;
	let magicSeedHasBeenGrabbed = false;
	let newMagicSeedVisible = false; // NOUVEAU

	let offsetsAreFrozen = false;

	$: if (expanded && boxWithAWord && engine) {
		Matter.Body.setStatic(boxWithAWord.body, false);
		Matter.Body.setStatic(newMagicSeed.body, true);
		engine.gravity.y = 1;
	}

	let timeSinceNewMagicSeedVisible = 0;
	let growthTimeout;

	$: innerWidth = 0;
	$: innerHeight = 0;

	onMount(() => {
		let isPhysicsActive = true;
		isMobile = /iPhone|iPad|iPod|Android/i.test(window.navigator.userAgent);

		engine = Matter.Engine.create();
		engine.gravity.y = 1;

		const boxWithAWordBody = Matter.Bodies.rectangle(
			window.innerWidth / 2,
			window.innerHeight / 2,
			50,
			50
		);
		const newMagicSeedBody = Matter.Bodies.rectangle(
			window.innerWidth / 4,
			window.innerHeight / 2,
			50,
			50,
			{
				collisionFilter: {
					category: 0x0002,
					mask: 0x0001
				}
			}
		);

		ground = Matter.Bodies.rectangle(
			window.innerWidth / 2,
			window.innerHeight + 250,
			window.innerWidth,
			500,
			{ isStatic: true }
		);
		leftWall = Matter.Bodies.rectangle(-250, window.innerHeight / 2, 500, window.innerHeight, {
			isStatic: true
		});
		rightWall = Matter.Bodies.rectangle(
			window.innerWidth + 250,
			window.innerHeight / 2,
			500,
			window.innerHeight,
			{ isStatic: true }
		);
		ceiling = Matter.Bodies.rectangle(window.innerWidth / 2, -250, window.innerWidth, 500, {
			isStatic: true
		});

		const mouse = Matter.Mouse.create(document.body);
		const mouseConstraint = Matter.MouseConstraint.create(engine, {
			mouse: mouse,
			constraint: {
				render: { visible: false },
				stiffness: 0.8
			},
			collisionFilter: {
				mask: 0x0001
			}
		});

		Matter.Composite.add(engine.world, [
			boxWithAWordBody,
			newMagicSeedBody,
			ground,
			leftWall,
			rightWall,
			ceiling,
			mouseConstraint
		]);

		const boxWithAWordElem = document.querySelector('#boxWithAWord');

		boxWithAWord = {
			body: boxWithAWordBody,
			elem: boxWithAWordElem,
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
			if (newMagicSeedVisible) {
				timeSinceNewMagicSeedVisible++;
			}
			const boxWithAWordPos = boxWithAWord.body.position;
			const targetPos = targetElem.getBoundingClientRect();
			const targetCenter = {
				x: targetPos.left + targetPos.width / 2,
				y: targetPos.top + targetPos.height / 2 + 7
			};

			const distance = Math.sqrt(
				Math.pow(boxWithAWordPos.x - targetCenter.x, 2) +
					Math.pow(boxWithAWordPos.y - targetCenter.y, 2)
			);

			if (distance < 50) {
				Matter.Body.setPosition(boxWithAWord.body, targetCenter);
				Matter.Body.setVelocity(boxWithAWord.body, { x: 0, y: 0 });
				Matter.Body.setAngularVelocity(boxWithAWord.body, 0);
				isRainTriggered.set(true);
			} else {
				isRainTriggered.set(false);
			}

			if (
				!(magicSeedHasHitGround || magicSeedHasBeenGrabbed) &&
				newMagicSeed &&
				!newMagicSeed.body.isStatic
			) {
				const currentAngularVelocity = newMagicSeed.body.angularVelocity;
				if (timeSinceNewMagicSeedVisible <= 50) {
					Matter.Body.setAngularVelocity(newMagicSeed.body, currentAngularVelocity + 0.0005);
				}
				if (timeSinceNewMagicSeedVisible > 40) {
					Matter.Body.setAngularVelocity(newMagicSeed.body, currentAngularVelocity + 0.01);
				}

				Matter.Body.applyForce(newMagicSeed.body, newMagicSeed.body.position, {
					x: 0.0006,
					y: -0.001
				});
			}

			magicSeedPositionX = newMagicSeed.body.position.x;
			magicSeedPositionY = newMagicSeed.body.position.y;

			// METTRE À JOUR LES OFFSETS EN CONTINU seulement si pas figés
			if (!offsetsAreFrozen) {
				magicSeedBloomLeftOffset.set(-(magicSeedPositionX - (25 + innerWidth / 2)));
				magicSeedBloomBottomOffset.set(magicSeedPositionY - (innerHeight - 25));
			}
			// Publier la position dans le store
			physicsSyncStore.set({
				active: newMagicSeedVisible && !newMagicSeed.body.isStatic,
				x: newMagicSeed.body.position.x,
				y: newMagicSeed.body.position.y,
				angle: newMagicSeed.body.angle,
				grounded: magicSeedHasHitGround
			});

			boxWithAWord.render();
			newMagicSeed.render();

			if (isPhysicsActive) {
				Matter.Engine.update(engine);
			}

			requestAnimationFrame(render);

			if (timeSinceNewMagicSeedVisible > 1000) {
				timeSinceNewMagicSeedVisible = 0;
			}
		};

		render();

		const handleMouseUp = () => {
			isGrabbing = false;
			boxWithAWordElem.style.cursor = 'grab';
			document.body.style.cursor = 'default';
			document.removeEventListener('mousemove', handleMouseMove);
			document.removeEventListener('mouseup', handleMouseUp);
		};

		const handleMouseMove = () => {
			if (isGrabbing) {
				boxWithAWordElem.style.cursor = 'grabbing';
				document.body.style.cursor = 'grabbing';
			}
		};

		boxWithAWordElem.addEventListener('mousedown', () => {
			isGrabbing = true;
			boxWithAWordElem.style.cursor = 'grabbing';
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

					if (growthTimeout) {
						clearTimeout(growthTimeout);
					}

					growthTimeout = setTimeout(() => {
						const currentAngle = newMagicSeed.body.angle;
						if (currentAngle !== 0) {
							Matter.Body.setAngle(newMagicSeed.body, 0);
							newMagicSeedElem.style.transform = `rotate(0rad)`;
						}

						// FIGER LES OFFSETS avant le blooming
						offsetsAreFrozen = true;

						// Calculer les offsets finaux une dernière fois
						const finalCenterX = newMagicSeed.body.position.x;
						const finalCenterY = newMagicSeed.body.position.y;

						magicSeedBloomLeftOffset.set(-(finalCenterX - innerWidth / 2));
						magicSeedBloomBottomOffset.set(-(innerHeight - finalCenterY - 25));

						// MAINTENANT on rend visible la MagicSeed Svelte
						newMagicSeedElem.style.opacity = '1';
						newMagicSeedElem.style.visibility = 'visible';

						magicSeedBloomLeftOffset.set(-(magicSeedPositionX - (25 + innerWidth / 2)));
						isMagicSeedBloomTriggered.set(true);
						newMagicSeedElem.style.cursor = 'default';
						Matter.Body.setStatic(newMagicSeed.body, true);
						isPhysicsActive = false;
						shouldFadeOutWebGLSeed.set(true);
					}, 1500);
				}
			});
		});
	});

	$: if (oldMagicSeedWasClicked) {
		if (oldMagicSeedPosition && newMagicSeed) {
			const newPosition = {
				x: oldMagicSeedPosition.left + 25,
				y: oldMagicSeedPosition.top + 25
			};
			Matter.Body.setPosition(newMagicSeed.body, newPosition);

			const angleInRadians = ((oldMagicSeedPosition.angle) * Math.PI) / 180;
			Matter.Body.setAngle(newMagicSeed.body, angleInRadians);
			Matter.Body.setStatic(newMagicSeed.body, false);

			// Déclencher le fondu d'apparition via la classe CSS
			newMagicSeedVisible = true;
		}
	}

	let magicSeedPositionX = 0;
	let magicSeedPositionY = 0;

	$: {
		if (isCloudAndRainHidden && !isRestoringFromSession) {
			setTimeout(() => {
				const elements = document.querySelectorAll('.hasToBeDestroyed');
				elements.forEach((element) => {
					element.remove();
				});
			}, 3000);
		} else if (isCloudAndRainHidden && isRestoringFromSession) {
			const elements = document.querySelectorAll('.hasToBeDestroyed');
			elements.forEach((element) => {
				element.remove();
			});
		}
	}

	$: {
		if (newMagicSeed && newMagicSeed.body && innerWidth > 0 && innerHeight > 0) {
			const centerX = newMagicSeed.body.position.x;
			const centerY = newMagicSeed.body.position.y;

			// Convertir du centre vers le coin supérieur gauche (top/left)
			magicSeedPositionX = centerX - 25;
			magicSeedPositionY = centerY - 25;

			// Calculer les offsets pour le blooming SEULEMENT si on n'a pas figé
			if (!offsetsAreFrozen) {
				magicSeedBloomLeftOffset.set(-(magicSeedPositionX - innerWidth / 2));
				magicSeedBloomBottomOffset.set(magicSeedPositionY - (innerHeight - 50));
			}
		}
	}
</script>

<svelte:window bind:innerWidth bind:innerHeight />

<div id="target" class:hidden={!expanded}>
	<div class:isCloudAndRainHidden class:noTransition={isRestoringFromSession}>
		<slot name="nuageSlot"></slot>
		{#if $isRainTriggered}
			<div class="hasToBeDestroyed">
				<slot name="appearsWhenBoxInNuage"></slot>
			</div>
		{/if}
	</div>
</div>

<!-- TREE EN DEHORS DE #target -->
<slot name="treeSlot"></slot>

<button
	id="boxWithAWord"
	on:click={toggleExpanded}
	class:isCloudAndRainHidden
	class:noTransition={isRestoringFromSession}
	class="hasToBeDestroyed">{expanded ? 'pluie' : 'rêve'}</button
>

<div id="newMagicSeed" class:visible={newMagicSeedVisible}>
	<slot name="magicSeedSlot"></slot>
</div>

<slot name="negativeCubeSlot"></slot>

<style>
	.hasToBeDestroyed {
		overflow: hidden;
	}

	:root {
		overflow: hidden;
		z-index: 25;
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

	#boxWithAWord {
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
		overflow: visible;
		cursor: default;
		border: none;
		opacity: 0;
		visibility: hidden;
		background-color: transparent;
		z-index: 50;
		transition: opacity 10ms ease-in-out;
	}

	/*#newMagicSeed.visible {
		opacity: 1;
		visibility: visible;
	}*/

	.isCloudAndRainHidden {
		opacity: 0;
		transition:
			opacity 2s ease-in-out,
			left 10s ease-in-out;
	}

	.noTransition {
		transition: none !important;
	}
</style>
