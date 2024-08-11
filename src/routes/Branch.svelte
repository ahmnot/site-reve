<script>
	import { onDestroy } from 'svelte';
	import MagicSeed from './MagicSeed.svelte';

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
		const timer = setTimeout(() => {
			branchDoneGrowing = true;
		}, 20);

		onDestroy(() => clearTimeout(timer));
	}

	const randomDelay = Math.random() * 4; // Generate random delay once
</script>

{#if holographic}
	<MagicSeed {rotation} {growing} />
{:else}
	<div
		class="branch"
		class:growing
		class:holographic
		style="--branchWidth: {width}; --branchLength: {length}; --color: {color}; --windIntensity: {windIntensity}; --randomDelay: {randomDelay}s;"
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
{/if}

<style>
	@keyframes sway {
		0% {
			transform: translateX(0);
		}
		50% {
			transform: translateX(calc(var(--windIntensity) * 0.4));
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
		transition: height 0.04s ease-out;
		animation-delay: var(--randomDelay);
		animation: sway 10s infinite ease-in-out;
		will-change: transform, height;
	}

	.branch.growing {
		height: var(--branchLength);
	}

	.branch.holographic {
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
		animation: holographic 5s ease-in-out infinite;
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
