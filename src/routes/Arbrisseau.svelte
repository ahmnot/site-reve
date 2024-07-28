<script>
    export let treeGround = '0';

    export let branch1Growing = false;
    export let branch1Left = '50%';
    export let branch1Direction = '0deg';
    export let branch1Length = '80px';

    let branch2Growing = false;
    export let branch2Left = '50%';
    export let branch2Direction = '90deg';
    export let branch2Length = '250px';

    let branch1DoneGrowing = false;

    $: branch2Base = branch1Length;

    $: if (branch1Growing) {
        setTimeout(() => {
            branch1DoneGrowing = true;
            branch2Growing = branch1DoneGrowing;
        }, 2000); // Match the transition duration
    }

    $: branch2OffsetLeft = `calc(${branch2Left} - 5px)`;
</script>

<div class="tree" style="--treeGround: {treeGround};">
    <div class="branch1-container" 
        style=
		"
            left: {branch1Left}; 
            transform: rotate({branch1Direction});
    	"
	>
        <div class="branch1" class:growing={branch1Growing}
			style=
			"
				--branch1Length: {branch1Length};
			"
		>
    </div>
        <div class="branch2-container" 
			style=
				"
					left: {branch2OffsetLeft}; 
					bottom: {branch2Base}; 
					transform: rotate({branch2Direction});
				"
		>
            <div class="branch2" class:growing={branch2Growing} 
				style=
					"
						--branch2Length: {branch2Length};
					"
			>
			</div>
        </div>
    </div>
</div>

<style>
    .tree {
        position: absolute;
        bottom: -11.5%;
        transform: translateY(var(--treeGround));
    }

    .branch1-container, .branch2-container {
        position: absolute;
        bottom: 0;
        transform-origin: bottom center;
    }

    .branch1, .branch2 {
        width: 10px;
        height: 0;
        background: darkgoldenrod;
        transition: height 2s ease-out;
    }

    .branch1.growing {
        height: var(--branch1Length);
    }

    .branch2.growing {
        height: var(--branch2Length);
    }
</style>
