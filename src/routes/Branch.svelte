<script>
	import { onDestroy } from 'svelte';
	import MagicSeed from './MagicSeed.svelte';
	import { createEventDispatcher } from 'svelte';
    import { magicSeedPositionWritable } from '../lib/magicSeedPositionStore.js';

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

	const dispatch = createEventDispatcher();

	$: if (growing) {
		const timer = setTimeout(() => {
			branchDoneGrowing = true;
		}, 20);

		onDestroy(() => clearTimeout(timer));
	}

	function handleBranchMagicSeedClick() {

		const branchMagicSeedElement = document.querySelector('#branchMagicSeed');

		const rect = branchMagicSeedElement.getBoundingClientRect();

		// Update the store with the position
		magicSeedPositionWritable.set({ top: rect.top, left: rect.left, angle: rotation });

		dispatch('branchMagicSeedWasClicked');

		branchMagicSeedElement.remove();
	}

</script>

{#if magicseed}
	<div on:click={handleBranchMagicSeedClick}>
		<MagicSeed {parentLength} {rotation} {growing} id="branchMagicSeed" />
	</div>
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
				on:branchMagicSeedWasClicked
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
</style>
