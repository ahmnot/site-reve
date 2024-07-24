<!-- Ball.svelte -->
<script>
    import { onMount } from 'svelte';

    let ball;
    let isDragging = false;
    let offsetX, offsetY;
    let ballX = 50, ballY = 50;
    let velocityX = 0, velocityY = 0;
    const gravity = 0.5;
    const bounceFactor = 0.7;

    function handleMouseDown(event) {
        isDragging = true;
        offsetX = event.clientX - ballX;
        offsetY = event.clientY - ballY;
    }

    function handleMouseMove(event) {
        if (isDragging) {
            ballX = event.clientX - offsetX;
            ballY = event.clientY - offsetY;
            velocityX = event.movementX;
            velocityY = event.movementY;
        }
    }

    function handleMouseUp() {
        isDragging = false;
    }

    onMount(() => {
        const container = ball.parentElement;

        function updateBallPosition() {
            if (!isDragging) {
                velocityY += gravity;

                ballX += velocityX;
                ballY += velocityY;

                if (ballX < 0) {
                    ballX = 0;
                    velocityX = -velocityX * bounceFactor;
                } else if (ballX + ball.offsetWidth > container.offsetWidth) {
                    ballX = container.offsetWidth - ball.offsetWidth;
                    velocityX = -velocityX * bounceFactor;
                }

                if (ballY < 0) {
                    ballY = 0;
                    velocityY = -velocityY * bounceFactor;
                } else if (ballY + ball.offsetHeight > container.offsetHeight) {
                    ballY = container.offsetHeight - ball.offsetHeight;
                    velocityY = -velocityY * bounceFactor;
                }
            }

            ball.style.transform = `translate(${ballX}px, ${ballY}px)`;
            requestAnimationFrame(updateBallPosition);
        }

        updateBallPosition();
    });
</script>

<div
    class="ball"
    bind:this={ball}
    on:mousedown={handleMouseDown}
    on:mousemove={handleMouseMove}
    on:mouseup={handleMouseUp}
    on:mouseleave={handleMouseUp}
></div>

<style>
    .ball {
        width: 20px;
        height: 20px;
        background-color: LightSteelBlue;
        border-radius: 50%;
        position: absolute;
        cursor: pointer;
    }
</style>