<script>
	import {
		vigenereEncode,
		getRandomOneTwoOrThreeOrFourLetters,
		addSpacesBetweenLetters
	} from '../../lib/helpers/crypto.js';
	import { onMount } from 'svelte';

	export let growing = false;
	export let rotation;
	export let parentLength;

	export let blooming = false;
	export let leftOffset = 0;
	export let bottomOffset = 0;

	let showMysticalScripture = false;
	let randomMysticalText;
	let betterViewerHeight;

	// Définir un tableau de liens pour chaque lettre
	let letterLinks = [
		'https://on.soundcloud.com/RLm1XLikU6wCHiiv9',
		'https://open.spotify.com/intl-fr/track/4RrqbZboZwrMrm1UzcqWqb',
		'https://www.instagram.com/othmoat',
		'https://www.youtube.com/watch?v=F2hLJroML_w'
		// Ajoutez d'autres liens selon le nombre de lettres
	];

	onMount(() => {
		// Split the encoded text into an array of letters
		const mysticalText = vigenereEncode('SUPRAMONDE').split('');

		randomMysticalText = getRandomOneTwoOrThreeOrFourLetters(mysticalText);

		randomMysticalText = addSpacesBetweenLetters(randomMysticalText);
	});

	// Créer un tableau qui associe chaque lettre (non-espace) à son lien
	$: lettersWithLinks = randomMysticalText
		? (() => {
				let result = [];
				let linkCounter = 0;
				for (const letter of randomMysticalText) {
					if (letter === ' ') {
						result.push({ letter, link: null });
					} else {
						result.push({ letter, link: letterLinks[linkCounter] || '#' });
						linkCounter++;
					}
				}
				return result;
			})()
		: [];

	$: if (blooming) {
		setTimeout(() => {
			//fade in the mystical scripture after a delay
			showMysticalScripture = true;
		}, 1000);
	}

	$: innerHeight = 0;

	// Reactively update --betterViewerHeight in the browser
	$: if (typeof window !== 'undefined') {
		betterViewerHeight = innerHeight * 0.01;
		document.documentElement.style.setProperty('--betterViewerHeight', `${betterViewerHeight}px`);
	}
</script>

<svelte:window bind:innerHeight />

<div
	class="magic-seed holographic"
	class:growing
	class:blooming
	style="
	bottom: {parentLength};
	transform: rotate({rotation});
	--leftOffset: {leftOffset}px;
	--bottomOffset: {bottomOffset}px;
"
>
	{#if blooming}
		<div class="center-elements-grid">
			<div></div>
			<div class="letters-with-links slant mystical-alpha">
				{#each lettersWithLinks as item, index}
					{#if item.letter === ' '}
						<span>&nbsp;</span>
					{:else}
						<a
							href={item.link}
							target="_blank"
							rel="noopener noreferrer"
							on:touchstart={(event) => {
								event.preventDefault();
								// Ouvrir le lien dans un nouvel onglet en arrière-plan (si possible)
								const newWindow = window.open(item.link, '_blank', 'noopener,noreferrer');
								if (newWindow) {
									newWindow.blur();
									window.focus();
								}
							}}
						>
							<span
								class={showMysticalScripture ? 'fade-in-letter' : ''}
								data-hover-symbol={index === 0 ? '$' : index === 2 ? '%' : index === 4 ? '#'  : '?'}
								style="transition-delay: {index * 0.2}s"
							>
								{item.letter}
							</span>
						</a>
					{/if}
				{/each}
			</div>
			<div></div>
		</div>
	{/if}
</div>

<style>
	.letters-with-links a {
		text-decoration: none;
		color: inherit;
		display: inline-block;
		cursor: pointer;
	}

	/* Pseudo-élément qui affichera le symbole au survol */
	a span::after {
		content: '';
		position: absolute;
		top: 50%;
		left: 100%;
		transform: translate(10px, -50%);
		opacity: 0;
		transition: opacity 0.3s ease-in-out;
	}

	/* Au survol, on affiche le symbole défini dans data-hover-symbol */
	a span:hover::after {
		content: attr(data-hover-symbol);
		opacity: 1;
	}

	:root {
		--safe-area-inset-bottom: env(safe-area-inset-bottom, 0px);
	}

	span {
		position: relative;
		opacity: 0;
		display: inline-block;
	}

	.fade-in-letter {
		opacity: 1;
		transition: opacity 5s ease-in-out;
		background-image: linear-gradient(45deg, #c0c0c0, #e0e0e0, #f5f5f5, #c0c0c0);
		background-size: 400% 400%;
		-webkit-background-clip: text;
		background-clip: text;
		animation: shimmer 3s ease-in-out infinite;
	}

	.magic-seed {
		position: absolute;
		width: 0;
		height: 0;
		left: 0;
		transition:
			height 1s ease-out,
			width 1s ease-out,
			transform 1s ease-out;
		transform: translateZ(0);
		backface-visibility: hidden;
	}

	.magic-seed.growing {
		height: 50px;
		width: 50px;
	}

	.magic-seed.holographic {
		background-image: linear-gradient(
			135deg,
			hsl(2, 100%, 73%),
			hsl(53, 100%, 69%),
			hsl(93, 100%, 69%),
			hsl(176, 100%, 76%),
			hsl(228, 100%, 74%),
			hsl(283, 100%, 73%)
		);
		background-size: 400% 400%;
		animation: holographic 10s ease-in-out infinite;
	}

	@keyframes holographic {
		0% {
			background-position: 0% 50%;
		}
		50% {
			background-position: 100% 50%;
		}
		100% {
			background-position: 0% 50%;
		}
	}

	.magic-seed.blooming {
		height: calc(var(--betterViewerHeight) * 100);
		width: 50dvw;
		left: var(--leftOffset);
		bottom: var(--bottomOffset) !important;
		transition:
			height 0.25s ease-in-out,
			width 1.5s ease-in-out,
			transform 1s ease-out,
			left 1.5s ease-in-out,
			bottom 1s ease-in-out;
		z-index: 75 !important;
	}

	.center-elements-grid {
		display: flex;
		justify-content: center; /* Centre horizontalement */
		align-items: center; /* Centre verticalement */
		place-items: center;
		width: 100%;
		height: 100%;
	}

	.mystical-alpha {
		font-family: 'MysticalAlpha';
		font-size: 1.7em;
	}

	.slant {
		transform: scale(1) rotate(0deg) translate(0px, 0px) skew(0, 0deg);
	}

	.letters-with-links {
		display: block;
		padding: 10px;
		font-weight: normal;
		text-align: center;
		writing-mode: vertical-rl;
		text-orientation: upright;
		text-decoration: none;
		opacity: 0.9;
		color: transparent;
		text-shadow:
			1px 1px 0px rgba(0, 0, 0, 0.1),
			1px 1px 0px rgba(0, 0, 0, 0.1);
		transform: translateZ(0);
		backface-visibility: hidden;
	}

	@keyframes shimmer {
		0% {
			background-position: 0% 50%;
		}
		50% {
			background-position: 100% 50%;
		}
		100% {
			background-position: 0% 50%;
		}
	}
</style>
