<script>

	export let growing = false;
	export let rotation;
	export let parentLength;
	export let id;

</script>

<div
	{id}
	class="magic-seed holographic"
	class:growing
	style="
		bottom: {parentLength};
		transform: rotate({rotation});
	"
/>

<style>
	.magic-seed {
		position: absolute;
		width: 50px;
		height: 0;
		transition:
			height 0.05s ease-out,
			transform 1s ease-out;
	}

	.magic-seed:hover {
		cursor: pointer;
	}

	.magic-seed.growing {
		height: 50px;
	}

	.magic-seed.holographic {
		background-image: linear-gradient(
			135deg,
			hsl(2, 100%, 73%),
			hsl(53, 100%, 69%),
			hsl(93, 100%, 69%),
			hsl(176, 100%, 76%),
			hsl(228, 100%, 74%),
			hsl(283, 100%, 73%)
		);
		background-size: 400% 400%;
		animation: holographic 5s ease-in-out infinite;
	}

	@keyframes holographic {
		0% {
			background-position: 0% 50%;
		}
		50% {
			background-position: 100% 50%;
		}
		100% {
			background-position: 0% 50%;
		}
	}
</style>
