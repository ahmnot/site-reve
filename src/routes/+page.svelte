<script>
	import { onMount } from 'svelte';
	import '../global.css';
	import Ripple from './Ripple.svelte';
	import FlippableCard from './FlippableCard.svelte';
	import { startRipples, stopRipples, updateMousePosition } from '../lib/rippleStore.js';
	import MatterWorld from './MatterWorld.svelte';
	import ThreeWorld from './ThreeWorld.svelte';
	import Negative from './Negative.svelte';
</script>

<div class="outer-container">
    <div class="grid-container">
        <div>rêve</div>
        <div></div>
        <div on:mousedown={startRipples} on:mouseup={stopRipples} on:mousemove={updateMousePosition}>
            <Ripple />
        </div>
        <div class="left-div">
            <MatterWorld />
        </div>
        <div></div>
        <div class="negative-div">
            <Negative />
        </div>
        <div></div>
        <div>
            <FlippableCard 
                faces={[
                    {text: "vie", color: "tomato"},
                    {text: "ciel", color: "LightSteelBlue"},
                    {text: "terre", color: "lightgreen"},
                    // Add more faces if needed
                ]}
            />
        </div>
        <div>
            <ThreeWorld />
        </div>
    </div>
</div>

<style>
    .outer-container {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 100vw;
        height: 100vh;
    }

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

    .left-div {
        grid-area: 2 / 1;
        position: relative;
        overflow: hidden;
    }

    .negative-div {
        grid-area: 2 / 3;
        position: relative;
        overflow: hidden;
    }
</style>
