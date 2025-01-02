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

	.drop .stem .splat {
		animation-delay: var(--delay);

	}

	.drop {
		position: absolute;
		width: 1px;
		height: 100px;
		pointer-events: none;
		animation: drop var(--duration) linear infinite;
		left: var(--left);
		top: var(--top);
	}

	@keyframes drop {
		0% {
			transform: translateY(0);
		}
		100% {
			transform: translateY(var(--rainGround));
		}
	}

	.stem {
		width: 5px;
		height: 60%;
		margin-left: 7px;
		left: var(--left);
		background: linear-gradient(to bottom, rgba(0, 0, 0, 0.1), var(--color));
		animation: stem var(--duration) linear infinite;
	}

	@keyframes stem {
		0% {
			opacity: 1;
		}
		65% {
			opacity: 1;
		}
		75% {
			opacity: 0.75;
		}
		100% {
			opacity: 0.1;
		}
	}

	.splat {
		width: 5px;
		height: 0.5px;
		border-radius: 50%;
		opacity: 1;
		left: var(--left);
		border-top: 10px dotted var(--color);
		animation: splat var(--duration) linear infinite;
		display: block;
	}

	@keyframes splat {
		0% {
			opacity: 1;
			transform: scale(0);
		}
		80% {
			opacity: 1;
			transform: scale(0.5);
		}
		90% {
			opacity: 0.5;
			transform: scale(1);
		}
		100% {
			opacity: 0.1;
			transform: scale(2);
		}
	}
</style>
