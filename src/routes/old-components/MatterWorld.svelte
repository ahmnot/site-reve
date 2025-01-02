<script>
    import { onMount, onDestroy } from 'svelte';
    import Matter from 'matter-js';

    let engine;
    let render;
    let runner;
    let square;
    let ball;
    let ground;
    let leftWall;
    let rightWall;
    let ceiling;
    let matterDiv;

    let isDragging = false;
    let mousePosition = { x: 0, y: 0 };

    function setCursor(cursorStyle) {
        if (render && render.canvas) {
            render.canvas.style.cursor = cursorStyle;
        }
    }

    function updateCursor() {
        if (isDragging) {
            setCursor("grabbing");
        } else {
            const bodies = Matter.Composite.allBodies(engine.world);
            const hoveredBody = Matter.Query.point(bodies, mousePosition).find(body => body === square || body === ball);
            if (hoveredBody) {
                setCursor("grab");
            } else {
                setCursor("default");
            }
        }
        requestAnimationFrame(updateCursor);
    }

    onMount(() => {
        if (typeof window !== 'undefined') {
            // Create an engine
            engine = Matter.Engine.create();

            // Create a renderer
            render = Matter.Render.create({
                element: matterDiv,
                engine: engine,
                options: {
                    width: matterDiv.clientWidth,
                    height: matterDiv.clientHeight,
                    wireframes: false,
                    background: 'ffe4c4' // Set background color
                }
            });

            // Create a runner
            runner = Matter.Runner.create();

            // Create the draggable square
            square = Matter.Bodies.rectangle(matterDiv.clientWidth/2, matterDiv.clientHeight/3, 40, 40, {
                render: {
                    fillStyle: 'tomato'
                }
            });

            // Create the bouncy ball
            ball = Matter.Bodies.circle(200, 100, 20, {
                restitution: 0.9, // Make it bouncy
                render: {
                    fillStyle: 'lightsteelblue'
                }
            });

            // Create boundaries (right on the frontier)
            ground = Matter.Bodies.rectangle(matterDiv.clientWidth / 2, matterDiv.clientHeight + 30, matterDiv.clientWidth, 60, { 
                isStatic: true,
                render: {
                    visible: false // Make the ground invisible
                }
            });

            ceiling = Matter.Bodies.rectangle(matterDiv.clientWidth / 2, -30, matterDiv.clientWidth, 60, { 
                isStatic: true,
                render: {
                    visible: false // Make the ceiling invisible
                }
            });

            leftWall = Matter.Bodies.rectangle(-30, matterDiv.clientHeight / 2, 60, matterDiv.clientHeight, { 
                isStatic: true,
                render: {
                    visible: false // Make the left wall invisible
                }
            });

            rightWall = Matter.Bodies.rectangle(matterDiv.clientWidth + 30, matterDiv.clientHeight / 2, 60, matterDiv.clientHeight, { 
                isStatic: true,
                render: {
                    visible: false // Make the right wall invisible
                }
            });

            // Add all of the bodies to the world
            Matter.World.add(engine.world, [square, ball, ground, ceiling, leftWall, rightWall]);

            // Run the engine
            Matter.Runner.run(runner, engine);

            // Run the renderer
            Matter.Render.run(render);

            // Make the square draggable
            let mouse = Matter.Mouse.create(render.canvas);
            let mouseConstraint = Matter.MouseConstraint.create(engine, {
                mouse: mouse,
                constraint: {
                    stiffness: 0.2,
                    render: {
                        visible: false
                    }
                }
            });

            Matter.World.add(engine.world, mouseConstraint);
            render.mouse = mouse;

            // Handle window resize
            window.addEventListener('resize', onWindowResize);

            function onWindowResize() {
                render.options.width = matterDiv.clientWidth;
                render.options.height = matterDiv.clientHeight;

                Matter.Render.setPixelRatio(render, window.devicePixelRatio);
                render.canvas.width = matterDiv.clientWidth;
                render.canvas.height = matterDiv.clientHeight;

                Matter.Render.lookAt(render, {
                    min: { x: 0, y: 0 },
                    max: { x: matterDiv.clientWidth, y: matterDiv.clientHeight }
                });

                // Update boundary positions and dimensions
                Matter.Body.setPosition(ground, { x: matterDiv.clientWidth / 2, y: matterDiv.clientHeight + 30 });
                Matter.Body.setVertices(ground, Matter.Vertices.create([
                    { x: 0, y: matterDiv.clientHeight },
                    { x: matterDiv.clientWidth, y: matterDiv.clientHeight },
                    { x: matterDiv.clientWidth, y: matterDiv.clientHeight + 60 },
                    { x: 0, y: matterDiv.clientHeight + 60 }
                ], ground));

                Matter.Body.setPosition(ceiling, { x: matterDiv.clientWidth / 2, y: -30 });
                Matter.Body.setVertices(ceiling, Matter.Vertices.create([
                    { x: 0, y: -60 },
                    { x: matterDiv.clientWidth, y: -60 },
                    { x: matterDiv.clientWidth, y: 0 },
                    { x: 0, y: 0 }
                ], ceiling));

                Matter.Body.setPosition(leftWall, { x: -30, y: matterDiv.clientHeight / 2 });
                Matter.Body.setVertices(leftWall, Matter.Vertices.create([
                    { x: -60, y: 0 },
                    { x: 0, y: 0 },
                    { x: 0, y: matterDiv.clientHeight },
                    { x: -60, y: matterDiv.clientHeight }
                ], leftWall));

                Matter.Body.setPosition(rightWall, { x: matterDiv.clientWidth + 30, y: matterDiv.clientHeight / 2 });
                Matter.Body.setVertices(rightWall, Matter.Vertices.create([
                    { x: matterDiv.clientWidth, y: 0 },
                    { x: matterDiv.clientWidth + 60, y: 0 },
                    { x: matterDiv.clientWidth + 60, y: matterDiv.clientHeight },
                    { x: matterDiv.clientWidth, y: matterDiv.clientHeight }
                ], rightWall));
            }

            onWindowResize();

            // Cursor change logic
            Matter.Events.on(mouseConstraint, "startdrag", (event) => {
                if (event.body === square || event.body === ball) {
                    isDragging = true;
                    setCursor("grabbing");
                }
            });

            Matter.Events.on(mouseConstraint, "enddrag", (event) => {
                if (event.body === square || event.body === ball) {
                    isDragging = false;
                    updateCursor();
                }
            });

            Matter.Events.on(mouseConstraint, "mousemove", (event) => {
                mousePosition = event.mouse.position;
                if (!isDragging) {
                    updateCursor();
                }
            });

            // Start the cursor update loop
            requestAnimationFrame(updateCursor);

            return () => {
                if (render) {
                    Matter.Render.stop(render);
                    render.canvas.remove();
                    render.canvas = null;
                    render.context = null;
                    render.textures = {};
                }
                if (engine) {
                    Matter.World.clear(engine.world);
                    Matter.Engine.clear(engine);
                }
                if (runner) {
                    Matter.Runner.stop(runner);
                }
                window.removeEventListener('resize', onWindowResize);
            };
        }
    });

    onDestroy(() => {
        if (typeof window !== 'undefined') {
            if (render) {
                Matter.Render.stop(render);
                render.canvas.remove();
                render.canvas = null;
                render.context = null;
                render.textures = {};
            }
            if (engine) {
                Matter.World.clear(engine.world);
                Matter.Engine.clear(engine);
            }
            if (runner) {
                Matter.Runner.stop(runner);
            }
            window.removeEventListener('resize', onWindowResize);
        }
    });
</script>

<style>
    div {
        width: 100%;
        height: 100%;
        position: relative;
    }
</style>

<div bind:this={matterDiv}></div>
