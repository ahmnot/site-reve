<script>
	import Tree from './tree-components/Tree.svelte';
	import { generateBranches } from '../lib/branchesStore.js';
	import Worm from './Worm.svelte';

	let innerHeight = 0;
	let invertedBranches = [];
	let expanded = true;

	$: treeGroundPosition = -(innerHeight + (innerHeight * 0.5) / 33);

	// Génération de l'arbre inversé dès que la hauteur est disponible
	$: if (innerHeight) {
		invertedBranches = generateBranches({
			numberOfBranches: innerHeight > 700 ? innerHeight / 50 : innerHeight / 40,
			depth: 2,
			baseId: 'inverted',
			branchAngleLimitation: 120,
			initialBranchAngle: 90,
			initialBranchWidth: innerHeight / 33,
			initialBranchLength: innerHeight / 33,
			angleDecrementFactor: 0.95,
			widthDecrementFactor: 0.9,
			lengthDecrementFactor: 0.93,
			leafProbability: 0,
			spiralProbability: 0,
			initialBranchOnBranchProbability: 1,
			branchOnBranchProbabilityDecrementFactor: 1,
			subBranchesFixedParameters: {
				branchAngleLimitation: 30,
				initialBranchWidth: 5,
				initialBranchLength: 15,
				angleDecrementFactor: 1.9,
				lengthDecrementFactor: 0.98,
				widthDecrementFactor: 0.86,
				leafProbability: 0,
				spiralProbability: 0.007,
				initialBranchOnBranchProbability: 0.1,
				branchOnBranchProbabilityDecrementFactor: 0.9,
				isWindy: false
			},
			initialDepth: 5,
			magicSeedBranchPosition:
				(2 * (innerHeight > 700 ? innerHeight / 42 : innerHeight / 30)) / 3 - 2,
			oldMagicSeedWasClicked: false,
			isWindy: false
		});
	}
</script>

<svelte:window bind:innerHeight />

<div class="outer-container">
	{#if invertedBranches.length}
		<div class="central">
			<!-- Utilisation du composant Tree avec la classe "inverted" pour ajuster les styles -->
			<div class="left-adjuster">
				<Tree
					treeGround="{treeGroundPosition}px"
					isFirstBranchGrowing={true}
					allTheBranches={invertedBranches}
				/>
			</div>
		</div>
	{/if}
	<Worm numberRectangles={2} segmentLength={10} segmentWidth={5} speed={0.5} maxTurnAngle={0.1} />
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

	.left-adjuster {
		position: relative;
		left: -22.5%;
		display: flex;
		justify-content: center;
		/* Ajoutez une marge pour décaler verticalement le Tree */
		margin-top: 100dvh;
	}

	.central {
		display: flex;
		justify-content: center;
		align-items: center;
		background: linear-gradient(to top, #050b0e, #182b31, #503a19c0);
		width: calc(100dvh * var(--aspect-ratio));
		height: 100dvh;
		background-color: rgba(255, 252, 240, 0);
		max-width: 100dvw;
		max-height: 100dvh;
	}
</style>
