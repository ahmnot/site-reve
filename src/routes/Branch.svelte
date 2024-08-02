<script>
	export let zIndex;
	export let width;
	export let length;
	export let rotation;
	export let branches = [];
	export let growing = false;
	export let color = 'darkgoldenrod';
	export let windIntensity = 0;

	let branchDoneGrowing = false;

	$: if (growing) {
		setTimeout(() => {
			branchDoneGrowing = true;
		}, 20);
	}

	function getRandomDelay() {
		return Math.random() * 4; // Random delay between 0 and 4 seconds
	}
</script>

<div
	class="branch"
	class:growing
	style="z-index: {zIndex}; --branchWidth: {width}; --branchLength: {length}; --color: {color}; --windIntensity: {windIntensity}px; --randomDelay: {getRandomDelay()}s;"
>
	{#each branches as branch (branch.id)}
		<div class="branch-container" style="bottom: {length}; transform: rotate({branch.rotation});">
			<svelte:self
				zIndex={branch.zIndex}
				width={branch.width}
				length={branch.length}
				rotation={branch.rotation}
				branches={branch.branches}
				growing={branchDoneGrowing}
				color={branch.color}
				windIntensity={branch.windIntensity}
			/>
		</div>
	{/each}
</div>

<style>
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
</style>
