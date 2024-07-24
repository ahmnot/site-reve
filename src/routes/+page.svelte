<script>
	import '../global.css';
	import Ball from './Ball.svelte';
	import Ripple from './Ripple.svelte';
	import FlippableCard from './FlippableCard.svelte';

	let ripples = [];
	let rippleTarget;

	function createRipple(x, y, isFirst) {
		if (!rippleTarget) return;
		const container = rippleTarget;
		const rect = container.getBoundingClientRect();
		const size = isFirst
			? Math.max(rect.width, rect.height)
			: Math.max(rect.width, rect.height) / 1.75;
		const rippleX = x - rect.left - size / 2;
		const rippleY = y - rect.top - size / 2;

		const ripple = {
			id: `${Date.now()}-${Math.random()}`, // Ensure a unique ID
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
		createRipple(mouseX, mouseY, true);
		isFirstRipple = false;
		lastRippleTime = Date.now(); // Reset the last ripple time to now
	}

	function stopRipples() {
		rippleTarget = null;
		isFirstRipple = true;
	}

	function updateMousePosition(event) {
		mouseX = event.clientX;
		mouseY = event.clientY;

		const currentTime = Date.now();
		if (
			rippleTarget &&
			(mouseX !== lastMouseX || mouseY !== lastMouseY) &&
			currentTime - lastRippleTime >= rippleDelay
		) {
			createRipple(mouseX, mouseY, false);
			lastMouseX = mouseX;
			lastMouseY = mouseY;
			lastRippleTime = currentTime; // Update last ripple time
		}
	}

	let mouseX = 0;
	let mouseY = 0;
	let isFirstRipple = true;
	let lastMouseX = 0;
	let lastMouseY = 0;
	let lastRippleTime = 0;
	const rippleDelay = 40; // Delay in milliseconds between ripples
</script>

<div class="grid-container">
	<div></div>
	<div></div>
	<div on:mousedown={startRipples} on:mouseup={stopRipples} on:mousemove={updateMousePosition}>
		<Ripple {ripples} />
	</div>
	<div class="left-div">
		<Ball />
	</div>
	<div></div>
	<div></div>
	<div></div>
	<div>
		<FlippableCard frontText="vie" backText="ciel" />
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
		border-right: 1px dashed grey;
		border-bottom: 1px dashed grey;
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

	.left-div {
		grid-area: 1 / 1;
		position: relative;
		overflow: hidden;
	}
</style>
