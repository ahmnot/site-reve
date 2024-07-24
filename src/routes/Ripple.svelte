<script>
    import { ripples } from '../lib/rippleStore.js';
</script>

<div role="button" tabindex="0">
    {#each $ripples as ripple (ripple.id)}
        <div
            class="ripple"
            style="width: {ripple.size}px; height: {ripple.size}px; top: {ripple.y}px; left: {ripple.x}px;"
        ></div>
    {/each}
</div>

<style>
    .ripple {
        position: absolute;
        background: radial-gradient(circle, rgba(255, 255, 255, 0.9) 10%, rgba(240, 255, 255, 0.2) 70%);
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
</style>
