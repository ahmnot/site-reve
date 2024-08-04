<script>
	import Branch from './Branch.svelte';

	export let treeGround = '0';
	export let leftPosition = '50%';
	export let isFirstBranchGrowing = false;
	export let allTheBranches = [
		{
			id: 1,
			width: '10px',
			length: '50px',
			rotation: '0deg',
			childBranches: [
				{
					id: 2,
					width: '10px',
					length: '17.5vw',
					rotation: '90deg',
					childBranches: []
				}
			]
		}
	];
</script>

<div class="tree" style="--treeGround: {treeGround};">
	<div class="first-branch-container" style="left: {leftPosition}; transform: rotate({allTheBranches[0].rotation});">
		{#each allTheBranches as branch (branch.id)}
			<Branch
				zIndex={branch.zIndex}
				width={branch.width}
				length={branch.length}
				rotation={branch.rotation}
				childBranches={branch.childBranches}
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
		bottom: 0%;
        transform: translateY(var(--treeGround));
	}
</style>
