<script>
	import { onMount } from 'svelte';
	export let zIndex;
	export let width;
	export let length;
	export let rotation;
	export let childBranches = [];
	export let growing = false;
	export let color = 'darkgoldenrod';
	export let windIntensity = 0;
	export let holographic = false;

	let branchDoneGrowing = false;

	$: if (growing) {
		setTimeout(() => {
			branchDoneGrowing = true;
		}, 20);
	}

	function getRandomDelay() {
		return Math.random() * 4; // Random delay between 0 and 4 seconds
	}

	onMount(() => {
		if (holographic) {
			document.documentElement.style.setProperty('--background-x', `${windIntensity * 0.5}%`);
			document.documentElement.style.setProperty('--background-y', `${windIntensity * 0.5}%`);
		}
	});
</script>

<div
	class="branch"
	class:growing
	class:holographic
	style="--branchWidth: {width}; --branchLength: {length}; --color: {color}; --windIntensity: {windIntensity}px; --randomDelay: {getRandomDelay()}s;"
>
	{#each childBranches as branch (branch.id)}
		<div
			class="branch-container"
			style="bottom: {length}; transform: rotate({branch.rotation}); z-index: {branch.zIndex}"
		>
			<svelte:self
				zIndex={branch.zIndex}
				width={branch.width}
				length={branch.length}
				rotation={branch.rotation}
				childBranches={branch.childBranches}
				growing={branchDoneGrowing}
				color={branch.color}
				windIntensity={branch.windIntensity}
				holographic={branch.holographic}
			/>
		</div>
	{/each}
</div>

<style>
	:root {
		--sunpillar-1: hsl(2, 100%, 73%);
		--sunpillar-2: hsl(53, 100%, 69%);
		--sunpillar-3: hsl(93, 100%, 69%);
		--sunpillar-4: hsl(176, 100%, 76%);
		--sunpillar-5: hsl(228, 100%, 74%);
		--sunpillar-6: hsl(283, 100%, 73%);
	}

	@keyframes sway {
		0% {
			transform: translateX(0);
		}
		20% {
			transform: translateX(calc(var(--windIntensity) * 0.2));
		}
		40% {
			transform: translateX(calc(var(--windIntensity) * 0.4));
		}
		50% {
			transform: translateX(calc(var(--windIntensity) * 0.7));
		}
		60% {
			transform: translateX(calc(var(--windIntensity) * 0.4));
		}
		80% {
			transform: translateX(calc(var(--windIntensity) * 1));
		}
		100% {
			transform: translateX(0);
		}
	}

	.branch-container {
		position: absolute;
		bottom: 0;
		transform-origin: bottom center;
	}

	.branch {
		position: relative;
		width: var(--branchWidth);
		height: 0;
		background: var(--color);
		transition: height 0.05s ease-out;
		animation: sway 10s infinite ease-in-out;
		animation-delay: var(--randomDelay);
	}

	.branch.growing {
		height: var(--branchLength);
	}

	.branch.holographic {
		background-image: linear-gradient(
			135deg,
			var(--sunpillar-1),
			var(--sunpillar-2),
			var(--sunpillar-3),
			var(--sunpillar-4),
			var(--sunpillar-5),
			var(--sunpillar-6)
		);
		background-size: 200% 200%;
		animation: holographic 3s ease infinite;
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
</style>
