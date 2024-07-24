<script>
    import { onMount } from 'svelte';

    let ball;
    let isDragging = false;
    let offsetX, offsetY;
    let ballX = 50, ballY = 50;
    let velocityX = 0, velocityY = 0;
    const gravity = 0.5;
    const bounceFactor = 0.7;
    const velocityFactor = 5; // Factor to amplify the effect of mouse movements
    let lastMouseX = 0, lastMouseY = 0;

    function handleMouseDown(event) {
        isDragging = true;
        offsetX = event.clientX - ballX;
        offsetY = event.clientY - ballY;
        lastMouseX = event.clientX;
        lastMouseY = event.clientY;
        ball.style.cursor = 'grabbing'; // Change cursor to grabbing
        document.body.style.cursor = 'grabbing'; // Ensure cursor stays grabbing even when outside the ball
    }

    function handleMouseMove(event) {
        if (isDragging) {
            ballX = event.clientX - offsetX;
            ballY = event.clientY - offsetY;

            // Calculate velocity based on mouse movement and amplify it
            velocityX = (event.clientX - lastMouseX) * velocityFactor;
            velocityY = (event.clientY - lastMouseY) * velocityFactor;

            lastMouseX = event.clientX;
            lastMouseY = event.clientY;
        }
    }

    function handleMouseUp(event) {
        if (isDragging) {
            isDragging = false;
            ball.style.cursor = 'grab'; // Change cursor back to grab
            document.body.style.cursor = 'default'; // Reset cursor when not dragging
        }
    }

    onMount(() => {
        function updateBallPosition() {
            if (!ball || !ball.parentElement) {
                requestAnimationFrame(updateBallPosition);
                return;
            }

            const container = ball.parentElement;

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

                // Apply friction to reduce velocity over time
                velocityX *= 0.99;
                velocityY *= 0.99;
            }

            ball.style.transform = `translate(${ballX}px, ${ballY}px)`;
            requestAnimationFrame(updateBallPosition);
        }

        updateBallPosition();

        // Attach event listeners for mouse and touch events
        ball.addEventListener('mousedown', handleMouseDown);
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        ball.addEventListener('touchstart', handleTouchStart);
        document.addEventListener('touchmove', handleTouchMove);
        document.addEventListener('touchend', handleTouchEnd);
        document.addEventListener('touchcancel', handleTouchEnd);
    });

    function handleTouchStart(event) {
        handleMouseDown(event.touches[0]);
    }

    function handleTouchMove(event) {
        handleMouseMove(event.touches[0]);
    }

    function handleTouchEnd(event) {
        handleMouseUp(event.changedTouches[0]);
    }
</script>

<div
    class="ball"
    bind:this={ball}
></div>

<style>
    .ball {
        width: 40px;
        height: 40px;
        background-color: LightSteelBlue;
        border-radius: 50%;
        position: absolute;
        cursor: grab;
    }
</style>
