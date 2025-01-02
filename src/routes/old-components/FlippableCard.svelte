<script>
    export let faces = [
        {text: "vie", color: "bisque"},
        {text: "ciel", color: "LightSteelBlue"},
        {text: "3", color: "lightcoral"},
        // Add more faces as needed
    ];

    let currentFaceIndex = 0;
    let isFlipped = false;
    let direction = 1; // 1 for right, -1 for left

    function flipCard(event) {
        const cardWidth = event.currentTarget.offsetWidth;
        const clickPosition = event.clientX - event.currentTarget.getBoundingClientRect().left;
        
        direction = clickPosition > cardWidth / 2 ? 1 : -1;
        
        isFlipped = !isFlipped;
        if (isFlipped) {
            setTimeout(() => {
                currentFaceIndex = (currentFaceIndex + direction + faces.length) % faces.length;
                isFlipped = false;
            }, 170); // Slightly less than the transition duration to update the face
        }
    }

    $: currentFace = faces[currentFaceIndex];
    $: nextFace = faces[(currentFaceIndex + direction + faces.length) % faces.length];
</script>

<div class="card-container" role="button" tabindex="0" on:click={flipCard}>
    <div class="card" class:flipped={isFlipped} class:right={direction === 1} class:left={direction === -1}>
        <div class="card-front" style="background-color: {currentFace.color};">
            {currentFace.text}
        </div>
        <div class="card-back" style="background-color: {nextFace.color};">
            {nextFace.text}
        </div>
    </div>
</div>

<style>
    .card-container {
        perspective: 1000px;
        width: 100%;
        height: 100%;
        position: relative;
    }

    .card-container:hover {
        cursor: pointer;
    }

    .card {
        width: 100%;
        height: 100%;
        transform-style: preserve-3d;
        transition: transform 0.6s;
        position: relative;
    }

    .flipped.right {
        transform: rotateY(180deg);
    }

    .flipped.left {
        transform: rotateY(-180deg);
    }

    .card-front,
    .card-back {
        position: absolute;
        width: 100%;
        height: 100%;
        backface-visibility: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.5em;
    }

    .card-back {
        transform: rotateY(180deg);
    }
</style>
