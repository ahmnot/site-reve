<script>
    export let zIndex;
    export let width;
    export let length;
    export let rotation;
    export let branches = [];
    export let growing = false;
    export let color = 'darkgoldenrod';

    let branchDoneGrowing = false;

    $: if (growing) {
        setTimeout(() => {
            branchDoneGrowing = true;
        }, 20);
    }

</script>

<div
    class="branch"
    class:growing
    style="z-index: {zIndex}; --branchWidth: {width}; --branchLength: {length}; --color: {color};"
>
    {#each branches as branch (branch.id)}
        <div class="branch-container" style="bottom: {length}; transform: rotate({branch.rotation});">
            <svelte:self
                zIndex={branch.zIndex}
                width={branch.width}
                length={branch.length}
                rotation={branch.rotation}
                branches={branch.branches}
                growing={branchDoneGrowing}
                color={branch.color}
            />
        </div>
    {/each}
</div>

<style>
    .branch-container {
        position: absolute;
        bottom: 0;
        transform-origin: bottom center;
    }

    .branch {
        position: relative;
        width: var(--branchWidth);
        height: 0;
        background: var(--color);
        transition: height 0.05s ease-out;
    }

    .branch.growing {
        height: var(--branchLength);
    }
</style>
