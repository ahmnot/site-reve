<script>
	// Level3.svelte
	import { onMount } from 'svelte';

	const numberOfTopStars = 5;
	const numberOfMiddleStars = 5;
	const topStars = Array(numberOfTopStars).fill(0);
	const middleStars = Array(numberOfMiddleStars).fill(0);
</script>

<div class="outer-container">
	{#each topStars as _, i}
		<div
			class="star"
			style="left: {Math.random() * 100}%; 
					top: {Math.random() * 20}%;
					animation-delay: {Math.random() * 2}s;"
		></div>
	{/each}
	{#each middleStars as _, i}
		<div
			class="star"
			style="left: {Math.random() * 100}%; 
					top: {Math.random() * 75}%;
					animation-delay: {Math.random() * 2}s;"
		></div>
	{/each}
	<div class="central">
		<img src="/img/cercle-transparent.png" alt="Cercle" class="circle-image" />
	</div>
</div>

<style>
	/* Ajoutez ces styles */
	.circle-image {
		position: absolute;
		left: 50%;
		top: 20vh;
		transform: translate(-50%, -50%); /* Centrage précis */
		width: 100px; /* Ajustez selon la taille souhaitée */
		height: 100px;
		z-index: 10;
	}

	.outer-container {
		position: relative;
		display: flex;
		justify-content: center;
		align-items: flex-start;
		width: 100dvw;
		height: 100dvh;
		background: linear-gradient(
			to bottom,
			#070707,
			#070707,
			#070707,
			#090f11,
			#090f11,
			#131f24,
			#496b7c
		);
		color: #00000000;
	}

	.central {
		display: flex;
		justify-content: center;
		align-items: center;
		background: linear-gradient(
			to top,
			#496b7c,
			#131f24,
			#090f11,
			#090f11,
			#090f11,
			#070707,
			#000000
		);
		width: calc(100dvh * var(--aspect-ratio));
		height: 100dvh;
		background-color: rgba(255, 0, 0, 0);
		max-width: 100dvw;
		max-height: 100dvh;
	}

	.star {
		width: 1px;
		height: 1px;
		position: absolute;
		background: white;
		opacity: 0;
		animation:
			shimmer 3s ease-in-out infinite,
			twinkle 10s ease-in-out infinite;
        z-index: 5;
	}

	@keyframes shimmer {
		0%,
		100% {
			background-position: 100% 50%;
			transform: scale(1);
		}
		50% {
			background-position: 0% 50%;
			transform: scale(1.2);
		}
	}

	@keyframes twinkle {
		0%,
		100% {
			opacity: 0.2;
		}
		50% {
			opacity: 1;
		}
	}
</style>
