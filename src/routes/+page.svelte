<script>
	import '../global.css';

	let ripples = [];
	let intervalId;
	let rippleTarget;
	let mouseX = 0;
	let mouseY = 0;
	let isFlipped = false;

	function createRipple(x, y) {
		const container = rippleTarget;
		const rect = container.getBoundingClientRect();
		const size = Math.max(rect.width, rect.height);
		const rippleX = x - rect.left - size / 2;
		const rippleY = y - rect.top - size / 2;

		const ripple = {
			id: Date.now(),
			x: rippleX,
			y: rippleY,
			size
		};

		ripples = [...ripples, ripple];
		setTimeout(() => {
			ripples = ripples.filter((r) => r.id !== ripple.id);
		}, 1000);
	}

	function startRipples(event) {
		rippleTarget = event.currentTarget;
		updateMousePosition(event);
		createRipple(mouseX, mouseY);
		intervalId = setInterval(() => {
			if (rippleTarget) {
				createRipple(mouseX, mouseY);
			}
		}, 75);
	}

	function stopRipples() {
		clearInterval(intervalId);
		rippleTarget = null;
	}

	function updateMousePosition(event) {
		mouseX = event.clientX;
		mouseY = event.clientY;
	}

	function flipCard() {
		isFlipped = !isFlipped;
	}
</script>

<div class="grid-container">
	<div>rêve</div>
	<div></div>
	<div
		class="ripple-container"
		role="button"
		tabindex="0"
		on:mousedown={startRipples}
		on:mouseup={stopRipples}
		on:mouseleave={stopRipples}
		on:mousemove={updateMousePosition}
	>
		{#each ripples as ripple (ripple.id)}
			<div
				class="ripple"
				style="width: {ripple.size}px; height: {ripple.size}px; top: {ripple.y}px; left: {ripple.x}px;"
			></div>
		{/each}
	</div>
	<div></div>
	<div></div>
	<div></div>
	<div></div>
	<div
		class="card-container"
		role="button"
		tabindex="0"
		on:click={flipCard}
		class:flipped={isFlipped}
	>
		<div class="card">
			<div class="card-front">vie</div>
			<div class="card-back">ciel</div>
		</div>
	</div>
  <div></div>
</div>

<style>
	.grid-container {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		grid-template-rows: repeat(3, 1fr);
		width: 100vw;
		height: 100vh;
		max-width: calc(100vh * 9 / 16);
		max-height: calc(100vw * 16 / 9);
	}

	.grid-container > div {
		background-color: bisque;
		border: 1px dashed grey;
		position: relative; /* Needed for ripple effect */
		overflow: hidden; /* Hide overflow for ripple effect */
	}

	.grid-container > div:nth-child(1) {
		grid-area: 1 / 1;
		font-size: 1.5em;
	}
	.grid-container > div:nth-child(2) {
		grid-area: 1 / 2;
	}
	.grid-container > div:nth-child(3) {
		grid-area: 1 / 3;
		cursor: pointer;
	}
	.grid-container > div:nth-child(4) {
		grid-area: 2 / 1;
	}
	.grid-container > div:nth-child(5) {
		grid-area: 2 / 2;
	}
	.grid-container > div:nth-child(6) {
		grid-area: 2 / 3;
	}
	.grid-container > div:nth-child(7) {
		grid-area: 3 / 1;
	}
	.grid-container > div:nth-child(8) {
		grid-area: 3 / 2;
	}
	.grid-container > div:nth-child(9) {
		grid-area: 3 / 3;
	}

	.ripple-container {
		position: relative;
		overflow: hidden;
	}

	.ripple-container:hover {
		cursor: pointer;
	}

	.ripple {
		position: absolute;
		background: radial-gradient(circle, white 10%, Azure 70%);
		border-radius: 50%;
		transform: scale(0);
		animation: ripple-animation 1.5s cubic-bezier(0.4, 0, 0.2, 1);
	}

	@keyframes ripple-animation {
		0% {
			transform: scale(0);
			opacity: 1;
		}
		50% {
			transform: scale(1);
			opacity: 0;
		}
		100% {
			transform: scale(1.2);
			opacity: 0;
		}
	}

	.card-container {
		grid-area: 3 / 3;
		perspective: 1000px;
	}

  .card-container:hover {
    cursor: pointer;
  }

	.card {
		width: 100%;
		height: 100%;
		transform-style: preserve-3d;
		transition: transform 0.6s;
	}

	.flipped .card {
		transform: rotateY(180deg);
	}

	.card-front, .card-back {
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
