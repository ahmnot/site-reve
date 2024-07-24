<script>
	export let frontText = "Front";
	export let backText = "Back";
	let isFlipped = false;

	function flipCard() {
		isFlipped = !isFlipped;
	}
</script>

<div
	class="card-container"
	role="button"
	tabindex="0"
	on:click={flipCard}
	class:flipped={isFlipped}
>
	<div class="card">
		<div class="card-front">{frontText}</div>
		<div class="card-back">{backText}</div>
	</div>
</div>

<style>
	.card-container {
		perspective: 1000px;
		width: 100%;
		height: 100%;
	}

	.card-container:hover {
		cursor: pointer;
	}

	.card {
		width: 100%;
		height: 100%;
		transform-style: preserve-3d;
		transition: transform 0.6s;
		position: relative;
	}

	.flipped .card {
		transform: rotateY(180deg);
	}

	.card-front,
	.card-back {
		position: absolute;
		width: 100%;
		height: 100%;
		backface-visibility: hidden;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.5em;
	}

	.card-front {
		background-color: bisque;
	}

	.card-back {
		background-color: LightSteelBlue;
		transform: rotateY(180deg);
	}
</style>
