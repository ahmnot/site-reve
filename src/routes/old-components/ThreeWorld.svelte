<script>
    import { onMount, onDestroy } from 'svelte';
    import * as THREE from 'three';
    import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
    import { DragControls } from 'three/examples/jsm/controls/DragControls';

    let scene, camera, renderer, controls, dragControls;
    let square, ball;
    let container;

    onMount(() => {
        if (typeof window !== 'undefined') {
            // Initialize scene, camera, and renderer
            scene = new THREE.Scene();
            camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
            renderer = new THREE.WebGLRenderer();
            renderer.setSize(container.clientWidth, container.clientHeight);
            renderer.setClearColor(0xffe4c4)
            container.appendChild(renderer.domElement);

            // Add orbit controls
            controls = new OrbitControls(camera, renderer.domElement);
            controls.enableDamping = true;
            controls.dampingFactor = 0.25;
            controls.enableZoom = true;

            // Create a draggable square
            const squareGeometry = new THREE.BoxGeometry(1, 1, 1);
            const squareMaterial = new THREE.MeshBasicMaterial({ color: 0xff6347 }); // Tomato color
            square = new THREE.Mesh(squareGeometry, squareMaterial);
            square.position.set(0, 0, 0);
            scene.add(square);

            // Create a bouncy ball
            const ballGeometry = new THREE.SphereGeometry(0.5, 32, 32);
            const ballMaterial = new THREE.MeshBasicMaterial({ color: 0xb0c4de }); // LightSteelBlue color
            ball = new THREE.Mesh(ballGeometry, ballMaterial);
            ball.position.set(2, 1, 0);
            scene.add(ball);

            // Add drag controls
            dragControls = new DragControls([square], camera, renderer.domElement);
            dragControls.addEventListener('dragstart', function(event) {
                controls.enabled = false;
            });
            dragControls.addEventListener('dragend', function(event) {
                controls.enabled = true;
            });

            // Position the camera
            camera.position.z = 8;

            // Add light
            const light = new THREE.AmbientLight(0xffffff, 0.5);
            scene.add(light);

            const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
            directionalLight.position.set(5, 5, 5).normalize();
            scene.add(directionalLight);

            // Render loop
            const animate = function() {
                requestAnimationFrame(animate);
                controls.update();
                renderer.render(scene, camera);
            };

            animate();

            // Handle window resize
            window.addEventListener('resize', onWindowResize);

            function onWindowResize() {
                camera.aspect = container.clientWidth / container.clientHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(container.clientWidth, container.clientHeight);
            }

            return () => {
                // Clean up Three.js scene on component unmount
                window.removeEventListener('resize', onWindowResize);
                container.removeChild(renderer.domElement);
                scene = null;
                camera = null;
                renderer = null;
                controls.dispose();
                dragControls.dispose();
            };
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

<div bind:this={container}></div>
