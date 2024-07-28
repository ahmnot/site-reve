<script>
	import Branch from './Branch.svelte';

	export let treeGround = '0';
    export let leftPosition = '50%';
	export let isFirstBranchGrowing = false;
	export let branches = [
		{
			id: 1,
			length: '50px',
			direction: '0deg',
			branches: [
				{
					id: 2,
					length: '17.5vw',
					direction: '90deg',
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
	<div class="first-branch-container" style="left: {leftPosition}; transform: rotate({branches[0].direction});">
		{#each branches as branch (branch.id)}
			<Branch
				length={branch.length}
				direction={branch.direction}
				branches={branch.branches}
				growing={isFirstBranchGrowing}
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
		bottom: -11.5%;
		transform: translateY(var(--treeGround));
	}
</style>
