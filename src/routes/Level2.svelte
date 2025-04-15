<script>
	import Tree from './tree-components/Tree.svelte';
	import { generateBranches } from '../lib/branchesStore.js';

	let innerHeight = 0;
	let invertedBranches = [];

	// Génération de l'arbre inversé dès que la hauteur est disponible
	$: if (innerHeight) {
		invertedBranches = generateBranches({
			numberOfBranches: innerHeight > 700 ? innerHeight / 42 : innerHeight / 30,
			depth: 2,
			baseId: 'inverted',
			branchAngleLimitation: 45,
			// L'angle initial est à 180° pour inverser la croissance (du haut vers le bas)
			initialBranchAngle: 90,
			initialBranchWidth: innerHeight / 30,
			initialBranchLength: innerHeight / 20,
			angleDecrementFactor: 0.95,
			widthDecrementFactor: 0.9,
			lengthDecrementFactor: 0.91,
			leafProbability: 0,
			spiralProbability: 0,
			initialBranchOnBranchProbability: 0.9,
			branchOnBranchProbabilityDecrementFactor: 1.6,
			subBranchesFixedParameters: {
				branchAngleLimitation: 25,
				initialBranchWidth: 5,
				initialBranchLength: 15,
				angleDecrementFactor: 1.9,
				lengthDecrementFactor: 0.95,
				widthDecrementFactor: 0.9,
				leafProbability: 0,
				spiralProbability: 0.009,
				initialBranchOnBranchProbability: 0.1,
				branchOnBranchProbabilityDecrementFactor: 0.1
			},
			initialDepth: 2,
			magicSeedBranchPosition:
				(2 * (innerHeight > 700 ? innerHeight / 42 : innerHeight / 30)) / 3 - 2,
			oldMagicSeedWasClicked: false
		});
	}
</script>

<svelte:window bind:innerHeight />

<div class="outer-container">
	{#if invertedBranches.length}
		<!-- Utilisation du composant Tree avec la classe "inverted" pour ajuster les styles -->
		<Tree
			treeGround="-1420px"
			leftPosition="50%"
			isFirstBranchGrowing={true}
			allTheBranches={invertedBranches}
		/>
	{/if}
</div>

<style>
	.outer-container {
		position: relative;
		display: flex;
		justify-content: center;
		align-items: flex-start;
		width: 100dvw;
		height: 100dvh;
		background: linear-gradient(to top, #050b0e, #182b31, #244452);
		color: #ffffff00;
	}

</style>
