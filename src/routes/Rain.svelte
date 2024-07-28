<script>
	import { onMount, onDestroy } from 'svelte';
	import RainDrop from './RainDrop.svelte';

	export let width = '100%';
	export let left = '0';
	export let top = '0';
	export let rainColor = 'rgba(0, 0, 0, 0.5)';
	export let rainGround = '0';

	let drops = [];
	let backDrops = [];
	let increment = 0;
	let dropInterval;
	let initialDelay = 0;
	let direction = 1;
	let center = 50;
	let currentInterval = 1000;
	const minInterval = 50;

	const addDrop = () => {
		let randoHundo = Math.floor(Math.random() * (98 - 1 + 1) + 1);
		let randoFiver = Math.floor(Math.random() * (5 - 2 + 1) + 2);
		let position = center + increment * direction;

		if (Math.abs(position - center) < 50) {
			drops = [
				...drops,
				{
					left: position,
					delay: initialDelay.toFixed(2),
					duration: `1.0${randoHundo}`,
					color: rainColor,
					top,
					rainGround
				}
			];

			backDrops = [
				...backDrops,
				{
					left: position,
					delay: initialDelay.toFixed(2),
					duration: `0.8${randoHundo}`,
					color: rainColor,
					top,
					rainGround
				}
			];

			increment += randoFiver / 4;
			direction *= -1;
		} else {
			clearInterval(dropInterval);
		}
	};

	const startRain = () => {
		const intervalFunc = () => {
			addDrop();
			currentInterval = Math.max(minInterval, currentInterval * 0.75);
			clearInterval(dropInterval);
			dropInterval = setInterval(intervalFunc, currentInterval);
		};
		dropInterval = setInterval(intervalFunc, currentInterval);
	};

	onMount(() => {
		startRain();
	});

	onDestroy(() => {
		clearInterval(dropInterval);
	});
</script>

<div class="rain front-row" style="width: {width}; left: {left}; top: {top};">
	{#each drops as drop (drop.left)}
		<RainDrop {...drop} />
	{/each}
</div>
<div class="rain back-row" style="width: {width}; left: {left}; top: {top};">
	{#each backDrops as drop (drop.left)}
		<RainDrop {...drop} />
	{/each}
</div>

<style>
	.rain {
		position: absolute;
		height: 100px;
	}

	.rain.back-row {
		display: block;
		bottom: 60px;
		opacity: 0.5;
	}
</style>
