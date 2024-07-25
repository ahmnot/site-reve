<script>
    import '../global.css';
    import Ball from './Ball.svelte';
    import Ripple from './Ripple.svelte';
    import FlippableCard from './FlippableCard.svelte';
    import {
        startRipples,
        stopRipples,
        updateMousePosition
    } from '../lib/rippleStore.js';
	import Square from './Square.svelte';
</script>

<div class="grid-container">
    <div>rêve</div>
    <div></div>
    <div on:mousedown={startRipples} on:mouseup={stopRipples} on:mousemove={updateMousePosition}>
        <Ripple />
    </div>
    <div class="left-div">
        <Ball />
        <Square />
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
