<script>
    import { onMount, onDestroy } from 'svelte';

    let square;
    let isDragging = false;
    let offsetX, offsetY;
    let squareX = 50, squareY = 50;
    let velocityX = 0, velocityY = 0;
    let angle = 0; // Angle of rotation
    let angularVelocity = 0; // Angular velocity for rotation
    const gravity = 0.5;
    const bounceFactor = 0.3;
    const velocityFactor = 0.1;
    const friction = 0.9;
    const angularFriction = 0.98; // Friction for more realistic rotation damping
    const angleThreshold = 0.01; // Threshold for small angle
    let lastMouseX = 0, lastMouseY = 0;

    function handleMouseDown(event) {
        isDragging = true;
        offsetX = event.clientX - squareX;
        offsetY = event.clientY - squareY;
        lastMouseX = event.clientX;
        lastMouseY = event.clientY;
        square.style.cursor = 'grabbing';
        document.body.style.cursor = 'grabbing';
        event.preventDefault();
    }

    function handleMouseMove(event) {
        if (isDragging) {
            const container = square.parentElement;
            squareX = event.clientX - offsetX;
            squareY = event.clientY - offsetY;

            // Ensure the square stays within the container bounds
            if (squareX < 0) squareX = 0;
            if (squareY < 0) squareY = 0;
            if (squareX + square.offsetWidth > container.offsetWidth) squareX = container.offsetWidth - square.offsetWidth;
            if (squareY + square.offsetHeight > container.offsetHeight) squareY = container.offsetHeight - square.offsetHeight;

            // Calculate velocity based on mouse movement and amplify it
            velocityX = (event.clientX - lastMouseX) * velocityFactor;
            velocityY = (event.clientY - lastMouseY) * velocityFactor;

            // Update angle based on horizontal movement
            angle += (event.clientX - lastMouseX) * 0.002;

            lastMouseX = event.clientX;
            lastMouseY = event.clientY;
        }
    }

    function handleMouseUp(event) {
        if (isDragging) {
            isDragging = false;
            square.style.cursor = 'grab';
            document.body.style.cursor = 'default';
        }
    }

    function handleMouseLeave(event) {
        if (isDragging) {
            handleMouseUp(event);
        }
    }

    function applyRotationFriction() {
        angularVelocity *= angularFriction;
        if (Math.abs(angularVelocity) < 0.01) {
            angularVelocity = 0;
        }
        angle += angularVelocity;

        // Damping effect for small angles
        if (Math.abs(angle) < angleThreshold && angularVelocity === 0) {
            angle *= 0.9; // Gradually reduce the angle to zero
        }
    }

    function getRotatedCorners() {
        const centerX = squareX + square.offsetWidth / 2;
        const centerY = squareY + square.offsetHeight / 2;
        const halfDiagonal = Math.sqrt(Math.pow(square.offsetWidth, 2) + Math.pow(square.offsetHeight, 2)) / 2;
        const initialAngle = Math.atan2(square.offsetHeight, square.offsetWidth);

        return [
            {
                x: centerX + halfDiagonal * Math.cos(initialAngle + angle),
                y: centerY + halfDiagonal * Math.sin(initialAngle + angle),
            },
            {
                x: centerX + halfDiagonal * Math.cos(-initialAngle + angle),
                y: centerY + halfDiagonal * Math.sin(-initialAngle + angle),
            },
            {
                x: centerX + halfDiagonal * Math.cos(Math.PI - initialAngle + angle),
                y: centerY + halfDiagonal * Math.sin(Math.PI - initialAngle + angle),
            },
            {
                x: centerX + halfDiagonal * Math.cos(Math.PI + initialAngle + angle),
                y: centerY + halfDiagonal * Math.sin(Math.PI + initialAngle + angle),
            },
        ];
    }

    function handleBoundaryCollision() {
        const container = square.parentElement;
        const corners = getRotatedCorners();

        let collision = false;

        for (const corner of corners) {
            if (corner.x < 0) {
                collision = true;
                squareX -= corner.x;
                velocityX = -velocityX * bounceFactor;
                if (corner === corners[0] || corner === corners[3]) {
                    angularVelocity -= 0.1; // Change direction if the corner hitting is top-left or bottom-left
                } else {
                    angularVelocity += 0.1;
                }
            }
            if (corner.x > container.offsetWidth) {
                collision = true;
                squareX -= (corner.x - container.offsetWidth);
                velocityX = -velocityX * bounceFactor;
                if (corner === corners[1] || corner === corners[2]) {
                    angularVelocity += 0.1; // Change direction if the corner hitting is top-right or bottom-right
                } else {
                    angularVelocity -= 0.1;
                }
            }
            if (corner.y < 0) {
                collision = true;
                squareY -= corner.y;
                velocityY = -velocityY * bounceFactor;
                if (corner === corners[0] || corner === corners[1]) {
                    angularVelocity -= 0.1; // Change direction if the corner hitting is top-left or top-right
                } else {
                    angularVelocity += 0.1;
                }
            }
            if (corner.y > container.offsetHeight) {
                collision = true;
                squareY -= (corner.y - container.offsetHeight);
                velocityY = -velocityY * bounceFactor;
                if (corner === corners[2] || corner === corners[3]) {
                    angularVelocity += 0.1; // Change direction if the corner hitting is bottom-left or bottom-right
                } else {
                    angularVelocity -= 0.1;
                }
            }
        }

        if (collision) {
            applyRotationFriction();
        }
    }

    onMount(() => {
        if (typeof window !== 'undefined') {
            function updateSquarePosition() {
                if (!square || !square.parentElement) {
                    requestAnimationFrame(updateSquarePosition);
                    return;
                }

                const container = square.parentElement;

                if (!isDragging) {
                    velocityY += gravity;

                    squareX += velocityX;
                    squareY += velocityY;

                    handleBoundaryCollision();

                    // Apply ground friction if square is on the ground
                    if (squareY + square.offsetHeight >= container.offsetHeight) {
                        velocityX *= friction;
                    }

                    applyRotationFriction();
                }

                square.style.transform = `translate(${squareX}px, ${squareY}px) rotate(${angle}rad)`;
                requestAnimationFrame(updateSquarePosition);
            }

            updateSquarePosition();

            if (square) {
                square.addEventListener('mousedown', handleMouseDown);
                document.addEventListener('mousemove', handleMouseMove);
                document.addEventListener('mouseup', handleMouseUp);
                document.addEventListener('mouseleave', handleMouseLeave);
                square.addEventListener('touchstart', handleTouchStart, { passive: true });
                document.addEventListener('touchmove', handleTouchMove, { passive: true });
                document.addEventListener('touchend', handleTouchEnd);
                document.addEventListener('touchcancel', handleTouchEnd);
            }
        }
    });

    onDestroy(() => {
        if (square) {
            square.removeEventListener('mousedown', handleMouseDown);
        }
        if (typeof document !== 'undefined') {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.removeEventListener('mouseleave', handleMouseLeave);
            if (square) {
                square.removeEventListener('touchstart', handleTouchStart);
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
    class="square"
    bind:this={square}
></div>

<style>
    .square {
        width: 40px;
        height: 40px;
        background-color: Tomato;
        position: absolute;
        cursor: grab;
    }
</style>
