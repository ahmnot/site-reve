<script>
	export let length;
	export let direction;
	export let branches = [];
	export let growing = false;
	export let color = 'darkgoldenrod';

	let branchDoneGrowing = false;

	$: if (growing) {
		setTimeout(() => {
			branchDoneGrowing = true;
		}, 100);
	}
</script>

<div class="branch" class:growing style="--branchLength: {length}; --color: {color};">
	{#each branches as branch (branch.id)}
		<div class="branch-container" 
        style="
            bottom: {length}; 
            transform: rotate({branch.direction})
        ;">
			<svelte:self
				length={branch.length}
				direction={branch.direction}
				branches={branch.branches}
				growing={branchDoneGrowing}
                color={branch.color}
			/>
		</div>
	{/each}
</div>

<style>
	.branch-container {
		position: absolute;
		bottom: 0;
		transform-origin: bottom center;
	}

	.branch {
		width: 10px;
		height: 0;
		background: var(--color);
		transition: height 0.1s ease-out;
	}

	.branch.growing {
		height: var(--branchLength);
	}
</style>
