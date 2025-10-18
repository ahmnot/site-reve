<script>
	// BoxWithAWordWithNuageTarget.svelte
	import { onMount } from 'svelte';
	import { magicSeedPositionWritable } from '../lib/magicSeedPositionStore.js';
	import { smallSeed0Position, smallSeed1Position, smallSeed2Position } from '../lib/smallMagicSeedsStore.js'; // NOUVEAU
	import { isRainTriggered } from '../lib/rainStore.js';
	import { isMagicSeedBloomTriggered, magicSeedBloomLeftOffset, magicSeedBloomBottomOffset } from '../lib/magicSeedBloomStore.js';

	let oldMagicSeedPosition;
	let isMobile;

	// Positions des oldSmallSeeds
	let oldSmallSeed0Pos;
	let oldSmallSeed1Pos;
	let oldSmallSeed2Pos;

	// Subscribe to the store to get the position
	magicSeedPositionWritable.subscribe((value) => {
		oldMagicSeedPosition = value;
	});

	// Subscribe aux positions des petites graines (NOUVEAU)
	smallSeed0Position.subscribe((value) => {
		oldSmallSeed0Pos = value;
	});
	smallSeed1Position.subscribe((value) => {
		oldSmallSeed1Pos = value;
	});
	smallSeed2Position.subscribe((value) => {
		oldSmallSeed2Pos = value;
	});

	import Matter from 'matter-js';

	export let expanded;
	export let toggleExpanded;

	export let oldMagicSeedWasClicked;

	export let isCloudAndRainHidden = false;

	let newMagicSeedElem;

	let boxWithAWord;
	let newMagicSeed;
	let smallSeeds = []; // tableau pour les petites graines
	let isGrabbing = false;
	let ground, leftWall, rightWall, ceiling;
	let engine;

	let magicSeedHasHitGround = false;
	let magicSeedHasBeenGrabbed = false;

	$: if (expanded && boxWithAWord && engine) {
		Matter.Body.setStatic(boxWithAWord.body, false);
		Matter.Body.setStatic(newMagicSeed.body, true);
		engine.gravity.y = 1;
	}

	let timeSinceNewMagicSeedVisible = 0;

	let growthTimeout;

	$: innerWidth = 0;
	$: innerHeight = 0;

	// Fonction pour gérer les clics sur les petites graines
	export function handleSmallSeedClick(event) {
		const { index, top, left, angle } = event.detail;
		const smallSeed = smallSeeds.find(s => s.index === index);
		if (smallSeed && smallSeed.body) {
			const newPosition = {
				x: left + 15, // Ajusté pour 30px de taille
				y: top + 15
			};
			Matter.Body.setPosition(smallSeed.body, newPosition);
			const angleInRadians = ((angle + 90) * Math.PI) / 180;
			Matter.Body.setAngle(smallSeed.body, angleInRadians);
			Matter.Body.setStatic(smallSeed.body, false);
			smallSeed.elem.style.visibility = 'visible';
		}
	}

	onMount(() => {
		let isPhysicsActive = true;

		isMobile = /iPhone|iPad|iPod|Android/i.test(window.navigator.userAgent);

		engine = Matter.Engine.create();
		engine.gravity.y = 1;

		const boxWithAWordBody = Matter.Bodies.rectangle(window.innerWidth / 2, window.innerHeight / 2, 50, 50);
		const newMagicSeedBody = Matter.Bodies.rectangle(
			window.innerWidth / 4,
			window.innerHeight / 2,
			50,
			50,
			{
				collisionFilter: {
					category: 0x0002, // This is a unique category for the magic seed
					mask: 0x0001 // This ensures it won't be grabbed by the mouseConstraint
				}
			}
		);

		// NOUVEAU: Créer les bodies pour les petites graines
		const smallSeedBodies = [];
		for (let i = 0; i < 3; i++) {
			smallSeedBodies.push(
				Matter.Bodies.rectangle(
					window.innerWidth / 4 + i * 100,
					window.innerHeight / 2,
					30, // Plus petites
					30,
					{
						collisionFilter: {
							category: 0x0002,
							mask: 0x0001
						},
						isStatic: true
					}
				)
			);
		}

		ground = Matter.Bodies.rectangle(
			window.innerWidth / 2,
			window.innerHeight + 250,
			window.innerWidth,
			500,
			{ isStatic: true }
		);
		leftWall = Matter.Bodies.rectangle(
			-250, 
			window.innerHeight / 2, 
			500, 
			window.innerHeight, 
			{isStatic: true}
		);
		rightWall = Matter.Bodies.rectangle(
			window.innerWidth + 250,
			window.innerHeight / 2,
			500,
			window.innerHeight,
			{ isStatic: true }
		);
		ceiling = Matter.Bodies.rectangle(
			window.innerWidth / 2, 
			-250, 
			window.innerWidth, 
			500, {
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
				mask: 0x0001 // Exclude the magic seed from the mouse interaction
			}
		});

		Matter.Composite.add(engine.world, [
			boxWithAWordBody,
			newMagicSeedBody,
			...smallSeedBodies,
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

		// Make the newMagicSeed lighter
		Matter.Body.setDensity(newMagicSeed.body, 0.001);

		// Initialiser les 3 newSmallSeeds avec Matter.js
		for (let i = 0; i < 3; i++) {
			const elem = document.querySelector(`#newSmallSeed-${i}`);
			if (elem) {
				const seed = {
					index: i,
					body: smallSeedBodies[i],
					elem: elem,
					render() {
						const { x, y } = this.body.position;
						this.elem.style.top = `${y - 15}px`; // 15 car 30/2
						this.elem.style.left = `${x - 15}px`;
						this.elem.style.transform = `rotate(${this.body.angle}rad)`;
					}
				};
				seed.body.frictionAir = 0.02;
				Matter.Body.setDensity(seed.body, 0.001);
				smallSeeds.push(seed);
			}
		}

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
			const boxWithAWordPos = boxWithAWord.body.position;
			const targetPos = targetElem.getBoundingClientRect();
			const targetCenter = {
				x: targetPos.left + targetPos.width / 2,
				y: targetPos.top + targetPos.height / 2 + 7
			};

			const distance = Math.sqrt(
				Math.pow(boxWithAWordPos.x - targetCenter.x, 2) + Math.pow(boxWithAWordPos.y - targetCenter.y, 2)
			);

			if (distance < 50) {
				Matter.Body.setPosition(boxWithAWord.body, targetCenter);
				Matter.Body.setVelocity(boxWithAWord.body, { x: 0, y: 0 });
				Matter.Body.setAngularVelocity(boxWithAWord.body, 0);
				isRainTriggered.set(true);
			} else {
				isRainTriggered.set(false);
			}

			// Increase the angular velocity over time
			if (!(magicSeedHasHitGround || magicSeedHasBeenGrabbed) && newMagicSeed && !newMagicSeed.body.isStatic) {
					const currentAngularVelocity = newMagicSeed.body.angularVelocity;
					// This is for the "falling in the wind" animation
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

			// Update the X position of newMagicSeed
			magicSeedPositionX = newMagicSeed.body.position.x;
			magicSeedPositionY = newMagicSeed.body.position.y;

			boxWithAWord.render();
			newMagicSeed.render();

			// Render les petites graines
			smallSeeds.forEach(seed => seed.render());

            // Update Matter seulement si actif
            if (isPhysicsActive) {
                Matter.Engine.update(engine);
            }

			requestAnimationFrame(render);

			if (timeSinceNewMagicSeedVisible>1000) {
				timeSinceNewMagicSeedVisible=0;
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

		// What happens when the magic seed hits the ground
		Matter.Events.on(engine, 'collisionStart', function (event) {
			event.pairs.forEach((pair) => {
				const { bodyA, bodyB } = pair;
				if (
					(bodyA === newMagicSeed.body && bodyB === ground) ||
					(bodyB === newMagicSeed.body && bodyA === ground)
				) {
					magicSeedHasHitGround = true;

					// Annule tout délai de croissance précédent si la graine touche à nouveau le sol
					if (growthTimeout) {
						clearTimeout(growthTimeout);
					}

					// Définir un délai avant de commencer la croissance
					growthTimeout = setTimeout(() => {

						// Correct the angle before blooming
						const currentAngle = newMagicSeed.body.angle;
						if (currentAngle !== 0) {
							// Adjust the angle to ensure the seed is upright
							Matter.Body.setAngle(newMagicSeed.body, 0);
							newMagicSeedElem.style.transform = `rotate(0rad)`;
						}

						// Correct the offset before blooming
						magicSeedBloomLeftOffset.set(-(magicSeedPositionX - (25 + innerWidth/2)))

						isMagicSeedBloomTriggered.set(true);

						newMagicSeedElem.style.cursor = "default";

						Matter.Body.setStatic(newMagicSeed.body, true);

                        // MAINTENANT on peut arrêter la physique
						isPhysicsActive = false;

					}, 1500); // Délai avant de commencer la croissance

				}
				
				// Gérer les collisions des petites graines avec le sol
				smallSeeds.forEach((seed) => {
					if (
						(bodyA === seed.body && bodyB === ground) ||
						(bodyB === seed.body && bodyA === ground)
					) {
						// Les petites graines restent simplement au sol, pas de croissance
						setTimeout(() => {
							Matter.Body.setStatic(seed.body, true);
							Matter.Body.setAngle(seed.body, 0);
							seed.elem.style.transform = 'rotate(0rad)';
						}, 1000);
					}
				});
			});
		});
	});

	// Réactions aux clics sur les oldSmallSeeds (via les stores)
	// Quand oldSmallSeed0 est cliquée
	$: if (oldSmallSeed0Pos && oldSmallSeed0Pos.clicked && smallSeeds.length > 0) {
		const seed = smallSeeds[0];
		const newPosition = {
			x: oldSmallSeed0Pos.left + 15, // 15 car 30/2
			y: oldSmallSeed0Pos.top + 15
		};
		Matter.Body.setPosition(seed.body, newPosition);
		const angleInRadians = ((oldSmallSeed0Pos.angle + 90) * Math.PI) / 180;
		Matter.Body.setAngle(seed.body, angleInRadians);
		Matter.Body.setStatic(seed.body, false); // Active la physique
		seed.elem.style.visibility = 'visible'; // Rend visible
	}

	// Quand oldSmallSeed1 est cliquée
	$: if (oldSmallSeed1Pos && oldSmallSeed1Pos.clicked && smallSeeds.length > 1) {
		const seed = smallSeeds[1];
		const newPosition = {
			x: oldSmallSeed1Pos.left + 15,
			y: oldSmallSeed1Pos.top + 15
		};
		Matter.Body.setPosition(seed.body, newPosition);
		const angleInRadians = ((oldSmallSeed1Pos.angle + 90) * Math.PI) / 180;
		Matter.Body.setAngle(seed.body, angleInRadians);
		Matter.Body.setStatic(seed.body, false);
		seed.elem.style.visibility = 'visible';
	}

	// Quand oldSmallSeed2 est cliquée
	$: if (oldSmallSeed2Pos && oldSmallSeed2Pos.clicked && smallSeeds.length > 2) {
		const seed = smallSeeds[2];
		const newPosition = {
			x: oldSmallSeed2Pos.left + 15,
			y: oldSmallSeed2Pos.top + 15
		};
		Matter.Body.setPosition(seed.body, newPosition);
		const angleInRadians = ((oldSmallSeed2Pos.angle + 90) * Math.PI) / 180;
		Matter.Body.setAngle(seed.body, angleInRadians);
		Matter.Body.setStatic(seed.body, false);
		seed.elem.style.visibility = 'visible';
	}

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

    let magicSeedPositionX = 0;
    let magicSeedPositionY = 0;

	$: {
    if (isCloudAndRainHidden) {
        setTimeout(() => {
            const elements = document.querySelectorAll('.hasToBeDestroyed');
            elements.forEach((element) => {
                element.remove();
            });
        }, 3000);
    }
	}

	$: magicSeedBloomLeftOffset.set(-(magicSeedPositionX - (25 + innerWidth/2)));
	$: magicSeedBloomBottomOffset.set((magicSeedPositionY - (innerHeight - 25)));

</script>

<svelte:window bind:innerWidth bind:innerHeight />

<div id="target" class:hidden={!expanded}>
	
	<div class:isCloudAndRainHidden>
		<slot name="nuageSlot"></slot>
		{#if $isRainTriggered}
			<div class="hasToBeDestroyed">
				<slot name="appearsWhenBoxInNuage"></slot>
			</div>
		{/if}
		
	</div>
	<!-- slot for the tree -->
	<slot name="treeSlot"></slot>

</div>

<button id="boxWithAWord" on:click={toggleExpanded} class:isCloudAndRainHidden class="hasToBeDestroyed">{expanded ? 'pluie' : 'rêve'}</button>

<!-- newMagicSeed : invisible au début, apparaît quand oldMagicSeed est cliquée -->
<div id="newMagicSeed" >
	<slot name="magicSeedSlot" ></slot>
</div>

<!-- NOUVEAU: Les 3 newSmallSeeds avec physique Matter.js, invisibles au début -->
<div id="newSmallSeed-0" class="small-magic-seed">
	<slot name="smallSeedSlot0"></slot>
</div>

<div id="newSmallSeed-1" class="small-magic-seed">
	<slot name="smallSeedSlot1"></slot>
</div>

<div id="newSmallSeed-2" class="small-magic-seed">
	<slot name="smallSeedSlot2"></slot>
</div>

<slot name="negativeCubeSlot" ></slot>

<style>
	.hasToBeDestroyed{
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
		visibility: hidden;
		background-color: transparent;
		z-index: 50;
	}

	/* Style pour les petites graines */
	.small-magic-seed {
		position: absolute;
		height: 30px;
		width: 30px;
		display: flex;
		align-items: center;
		justify-content: center;
		user-select: none;
		overflow: visible;
		cursor: default;
		border: none;
		visibility: hidden;/* Invisibles au début */
		background-color: transparent;
		z-index: 49;
	}

	.isCloudAndRainHidden {
		opacity: 0;
		transition: opacity 2s ease-in-out,
		left 10s ease-in-out;
	}
</style>
