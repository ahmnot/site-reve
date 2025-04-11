<script>
	import Tree from './tree-components/Tree.svelte';

	// GROWTH TRIGGERING LOGIC
	let isFirstBranchGrowing = false;

	let innerHeight = 0;

	$: treeGroundPosition = innerHeight *0.8;
	$: allTheBranches = {};

	function handleMagicSeedClick() {
		// do something
	}
</script>

<svelte:window bind:innerHeight />

<div class="outer-container">
	<Tree
		leftPosition="50%"
		treeGround="{treeGroundPosition}px"
		{isFirstBranchGrowing}
		{allTheBranches}
		on:branchMagicSeedWasClicked={handleMagicSeedClick}
	/>
</div>


<style>
	.outer-container {
		display: flex;
		justify-content: center;
		align-items: center;
		width: 100dvw;
		height: 100dvh;
		background: linear-gradient(to top, #050b0e, #182b31, #244452);
		color: #fff; /* optionnel, selon le contenu */
	}
</style>
