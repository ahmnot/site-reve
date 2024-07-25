<script>
    import { onMount, onDestroy } from 'svelte';

    let ball;
    let isDragging = false;
    let offsetX, offsetY;
    let ballX = 50, ballY = 50;
    let velocityX = 0, velocityY = 0;
    const gravity = 0.5;
    const bounceFactor = 0.5;
    const velocityFactor = 3; // Factor to amplify the effect of mouse movements
    let lastMouseX = 0, lastMouseY = 0;

    function handleMouseDown(event) {
        isDragging = true;
        offsetX = event.clientX - ballX;
        offsetY = event.clientY - ballY;
        lastMouseX = event.clientX;
        lastMouseY = event.clientY;
        ball.style.cursor = 'grabbing'; // Change cursor to grabbing
        document.body.style.cursor = 'grabbing'; // Ensure cursor stays grabbing even when outside the ball
        event.preventDefault(); // Prevent any default actions
    }

    function handleMouseMove(event) {
        if (isDragging) {
            const container = ball.parentElement;
            ballX = event.clientX - offsetX;
            ballY = event.clientY - offsetY;

            // Ensure the ball stays within the container bounds
            if (ballX < 0) ballX = 0;
            if (ballY < 0) ballY = 0;
            if (ballX + ball.offsetWidth > container.offsetWidth) ballX = container.offsetWidth - ball.offsetWidth;
            if (ballY + ball.offsetHeight > container.offsetHeight) ballY = container.offsetHeight - ball.offsetHeight;

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

    function handleMouseLeave(event) {
        if (isDragging) {
            handleMouseUp(event);
        }
    }

    onMount(() => {
        if (typeof window !== 'undefined') {
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

            // Attach event listeners for mouse and touch events if ball is defined
            if (ball) {
                ball.addEventListener('mousedown', handleMouseDown);
                document.addEventListener('mousemove', handleMouseMove);
                document.addEventListener('mouseup', handleMouseUp);
                document.addEventListener('mouseleave', handleMouseLeave);
                ball.addEventListener('touchstart', handleTouchStart, { passive: true });
                document.addEventListener('touchmove', handleTouchMove, { passive: true });
                document.addEventListener('touchend', handleTouchEnd);
                document.addEventListener('touchcancel', handleTouchEnd);
            }
        }
    });

    onDestroy(() => {
        if (ball) {
            ball.removeEventListener('mousedown', handleMouseDown);
        }
        if (typeof document !== 'undefined') {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.removeEventListener('mouseleave', handleMouseLeave);
            if (ball) {
                ball.removeEventListener('touchstart', handleTouchStart);
            }
            document.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('touchend', handleTouchEnd);
            document.removeEventListener('touchcancel', handleTouchEnd);
        }
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
