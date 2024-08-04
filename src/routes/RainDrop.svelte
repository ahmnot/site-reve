<script>
	export let left = 0;
	export let delay = 0;
	export let duration = 0;
	export let color = 'rgba(0, 0, 0, 0.5)';
	export let top = '0';
	export let rainGround = '0';
</script>

<div
	class="drop"
	style="--left: {left}%; --top: {top}; --delay: {delay}s; --duration: {duration}s; --color: {color}; --rainGround: {rainGround};"
>
	<div class="stem"></div>
	<div class="splat"></div>
</div>

<style>
	.drop {
		position: absolute;
		width: 1px;
		height: 100px;
		pointer-events: none;
		animation: drop var(--duration) linear infinite;
		left: var(--left);
		top: var(--top);
		animation-delay: var(--delay);
	}

	@keyframes drop {
		0% {
			transform: translateY(0);
		}
		75% {
			transform: translateY(var(--rainGround));
		}
		100% {
			transform: translateY(var(--rainGround));
		}
	}

	.stem {
		width: 5px;
		height: 60%;
		margin-left: 7px;
		background: linear-gradient(to bottom, rgba(0, 0, 0, 0.1), var(--color));
		animation: stem var(--duration) linear infinite;
		animation-delay: var(--delay);
	}

	@keyframes stem {
		0% {
			opacity: 1;
		}
		65% {
			opacity: 1;
		}
		75% {
			opacity: 0;
		}
		100% {
			opacity: 0;
		}
	}

	.splat {
		width: 15px;
		height: 10px;
		border-radius: 50%;
		opacity: 1;
		transform: scale(0);
		border-top: 2px dotted var(--color);
		animation: splat var(--duration) linear infinite;
		animation-delay: var(--delay);
		display: block;
	}

	@keyframes splat {
		0% {
			opacity: 1;
			transform: scale(0);
		}
		80% {
			opacity: 1;
			transform: scale(0);
		}
		90% {
			opacity: 0.5;
			transform: scale(1);
		}
		100% {
			opacity: 0;
			transform: scale(2);
		}
	}
</style>
