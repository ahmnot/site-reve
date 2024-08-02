<script>
	import Branch from './Branch.svelte';

	export let treeGround = '0';
	export let leftPosition = '50%';
	export let isFirstBranchGrowing = false;
	export let branches = [
		{
			id: 1,
			width: '10px',
			length: '50px',
			rotation: '0deg',
			branches: [
				{
					id: 2,
					width: '10px',
					length: '17.5vw',
					rotation: '90deg',
					branches: []
				}
			]
		}
	];

	setTimeout(() => {
		branches[0].branches[0].growing = true;
	}, 100);
</script>

<div class="tree" style="--treeGround: {treeGround};">
	<div class="first-branch-container" style="left: {leftPosition}; transform: rotate({branches[0].rotation});">
		{#each branches as branch (branch.id)}
			<Branch
				zIndex={branch.zIndex}
				width={branch.width}
				length={branch.length}
				rotation={branch.rotation}
				branches={branch.branches}
				growing={isFirstBranchGrowing}
				color={branch.color}
                windIntensity={branch.windIntensity}
			/>
		{/each}
	</div>
</div>

<style>
	.first-branch-container {
		position: absolute;
		bottom: 0;
		transform-origin: bottom center;
	}

	.tree {
		position: absolute;
		bottom: -77%;
		transform: translateY(var(--treeGround));
	}
</style>
