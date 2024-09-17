<script>
	import { vigenereEncode } from '../lib/helpers/crypto.js';
	export let growing = false;
	export let rotation;
	export let parentLength;

	export let blooming=false;
	export let leftOffset=0;
	export let bottomOffset=0;
</script>

<div
class="magic-seed holographic"
class:growing
class:blooming
style="
	bottom: {parentLength};
	transform: rotate({rotation});
	--leftOffset: {leftOffset}px;
	--bottomOffset: {bottomOffset}px;
"
>
{#if blooming}
<div class="center-elements-grid">
	<div></div>
	<a class="soundcloud-link slant mystical-alpha" href="https://on.soundcloud.com/RLm1XLikU6wCHiiv9">
		{vigenereEncode("S O U N D C L D")}
	</a>
	<div></div>
</div>
{/if}
</div>

<style>
	.center-elements-grid {
		display: grid;
		place-items: center; 
		width: 100%;
		height: 100%;
	}

	.mystical-alpha {
		font-family: 'MysticalAlpha';
		font-size: 4vh;
	}

	.slant {
		transform: scale(1) rotate(0deg) translate(0px, 0px) skew(0, 0deg);
	}

	.soundcloud-link {
		display: block;
		padding: 10px;
		font-weight: normal;
		text-align: center;
		writing-mode: vertical-rl;
		text-orientation: upright;
		text-decoration: none;
		opacity: 0.9;
		color: transparent;
		background-image: linear-gradient(45deg, #C0C0C0, #E0E0E0, #F5F5F5, #C0C0C0);
		background-size: 400% 400%;
		-webkit-background-clip: text;
		background-clip: text;
		animation: shimmer 3s ease-in-out infinite;
		cursor: pointer;
		text-shadow: 
			1px 1px 0px rgba(0, 0, 0, 0.1), 
			1px 1px 0px rgba(0, 0, 0, 0.1);
	}

	@keyframes shimmer {
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

	.magic-seed {
		position: absolute;
		width: 0;
		height: 0;
		left: 0;
		transition:
			height 1s ease-out,
			width 1s ease-out,
			transform 1s ease-out;
	}

	.magic-seed.growing {
		height: 50px;
		width: 50px;
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
		animation: holographic 10s ease-in-out infinite;
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

	.magic-seed.blooming {
		height: 100vh; 
		width: 50vw; 
		left: var(--leftOffset);
		bottom: var(--bottomOffset) !important;
		transition:
			height 0.25s ease-in-out,
			width 1.5s ease-in-out,
			transform 1s ease-out,
			left 1.5s ease-in-out,
			bottom 1s ease-in-out;
	}
</style>
