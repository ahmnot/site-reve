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
	export let magicseed = false;
	export let parentLength = 0;
	export let windy = true;

	let branchDoneGrowing = false;

	$: if (growing) {
		const timer = setTimeout(() => {
			branchDoneGrowing = true;
		}, 20);

		onDestroy(() => clearTimeout(timer));
	}

</script>

{#if magicseed}
	<MagicSeed {parentLength} {rotation} {growing} />
{:else}
	<div
		class="branch"
		class:growing
		class:windy
		class:magicseed
		style="
		width: {width};  
		background: {color}; 
		bottom: {parentLength}; 
		transform: rotate({rotation});
		z-index: {zIndex};
		--windIntensity: {windIntensity}; 
		--branchLength: {length};
		--rotation: {rotation};
		"
	>
		{#each childBranches as branch (branch.id)}
			<svelte:self
				zIndex={branch.zIndex}
				width={branch.width}
				length={branch.length}
				rotation={branch.rotation}
				childBranches={branch.childBranches}
				growing={branchDoneGrowing}
				color={branch.color}
				windIntensity={branch.windIntensity}
				magicseed={branch.magicseed}
				windy={branch.windy}
				parentLength={length}
			/>
		{/each}
	</div>
{/if}

<style>
	@keyframes sway {
		0% {
			transform: translateX(0) rotate(var(--rotation));
		}
		50% {
			transform: translateX(calc(var(--windIntensity) * 0.4)) rotate(var(--rotation));
		}
		100% {
			transform: translateX(0) rotate(var(--rotation));
		}
	}

	.branch {
		position: absolute;
		height: 0;
		transition: height 0.05s ease-out;
		transform-origin: bottom center;
		will-change: transform, height;
	}

	.branch.windy {
		animation: sway 5s ease-in-out infinite;
	}

	.branch.growing {
		height: var(--branchLength);
	}

	.branch.magicseed {
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
