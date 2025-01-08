<script>
	import { onMount } from 'svelte';
	import {
		PerspectiveCamera,
		Scene,
		WebGLRenderer,
		PointLight,
		ShaderMaterial,
		BoxGeometry,
		Mesh,
		Vector3,
		Matrix4,
		Clock
	} from 'three';
	import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
	import { Group } from 'three';

	export let isVisible = false;

	let container;

	import iridescentCubeVS from '../lib/shaders/iridescentCubeVS.glsl';
	import iridescentCubeFS from '../lib/shaders/iridescentCubeFS.glsl';
	import simpleCubeVS from '../lib/shaders/simpleCubeVS.glsl';
	import simpleCubeFS from '../lib/shaders/simpleCubeFS.glsl';

	onMount(async () => {
		// 1. Create scene and camera
		const scene = new Scene();
		const camera = new PerspectiveCamera(
			22.5,
			container.clientWidth / container.clientHeight,
			0.01,
			100
		);
		camera.position.set(0, 0, -40); // Adjust as you like

		// 2. Create renderer
		const renderer = new WebGLRenderer({ antialias: true, alpha: true });
		renderer.setSize(container.clientWidth, container.clientHeight);
		renderer.setClearColor(0xff0000, 0); // transparent background
		container.appendChild(renderer.domElement);

		// 3. Optional: OrbitControls for pinch-zoom, etc.
		const controls = new OrbitControls(camera, renderer.domElement);
		controls.enableRotate = false; // We'll do our own rotation
		controls.enablePan = false;    // We'll do our own pan
		controls.enableZoom = true;    // Keep zoom if you like
        controls.target.set(4, 0, 0); // Move cube to the right
		controls.update();

		// 4. Create a root group (for rotation, etc.)
		const rootGroup = new Group();
		scene.add(rootGroup);

		// 5. Orbit group that holds your cubes + light
		const orbitGroup = new Group();
		rootGroup.add(orbitGroup);

		// 6. Create main (iridescent) cube
		const iridescentCubeGeometry = new BoxGeometry(1, 1, 1);
		const iridescentCubeMaterial = new ShaderMaterial({
			vertexShader: iridescentCubeVS,
			fragmentShader: iridescentCubeFS,
			uniforms: {
				lightPosition: { value: new Vector3(1.2, 1, 2) },
				modelMatrix: { value: new Matrix4() },
				varyingColor: { value: new Vector3(1, 1, 1) },
				material: { value: { shininess: 64.0 } },
				lightProperties: {
					value: {
						ambient: new Vector3(1.0, 1.0, 1.0),
						diffuse: new Vector3(0.75, 0.75, 0.75),
						specular: new Vector3(1.5, 1.5, 1.5),
						attenuationConstantTerm: 1.0,
						attenuationLinearTerm: 0.09,
						attenuationQuadraticTerm: 0.032
					}
				}
			}
		});
		const iridescentCube = new Mesh(iridescentCubeGeometry, iridescentCubeMaterial);
		orbitGroup.add(iridescentCube);

		// 7. Create lamp cube
		const lampCubeGeometry = new BoxGeometry(0.2, 0.2, 0.2);
		const lampCubeMaterial = new ShaderMaterial({
			vertexShader: simpleCubeVS,
			fragmentShader: simpleCubeFS,
			uniforms: {
				modelMatrix: { value: new Matrix4() },
				cubeColor: { value: new Vector3(0, 0, 0) }
			}
		});
		const lampCube = new Mesh(lampCubeGeometry, lampCubeMaterial);
		orbitGroup.add(lampCube);

		// 8. Create point light
		const pointLight = new PointLight(0xffffff, 1, 100);
		orbitGroup.add(pointLight);

		// 9. Clock for animation
		const clock = new Clock();

		// 10. Animation loop
		function animate() {
			requestAnimationFrame(animate);

			const elapsedTime = clock.getElapsedTime();
			const orbitRadius = 1.0;
			const angle = elapsedTime;

			// Move lampCube around the main cube
			lampCube.position.set(
				Math.sin(angle) * orbitRadius,
				Math.sin(angle) * Math.cos(angle) * 1.5,
				Math.cos(angle) * orbitRadius
			);

			// Light follows the lampCube
			const worldPosition = new Vector3();
			lampCube.getWorldPosition(worldPosition);
			pointLight.position.copy(worldPosition);

			// Update iridescentCubeMaterial's light position
			iridescentCubeMaterial.uniforms.lightPosition.value.copy(worldPosition);

			// Update "iridescent" color
			iridescentCubeMaterial.uniforms.varyingColor.value.set(
				Math.sin(elapsedTime * 3.5) * 0.5 + 0.5,
				Math.sin(elapsedTime * 1.5) * 0.5 + 0.5,
				Math.sin(elapsedTime * 2.5) * 0.5 + 0.5
			);

			// Render
			renderer.render(scene, camera);
		}
		animate();

		// 11. Custom pointer logic
		let isPanning = false;
		let isRotating = false;
		let lastX = 0;
		let lastY = 0;

		function onPointerDown(event) {
			// Disable default context menu on right-click
			if (event.button === 2) {
				event.preventDefault();
			}

			// Left click => pan
			if (event.button === 0) {
				isPanning = true;
				lastX = event.clientX;
				lastY = event.clientY;
			}
			// Right click => rotate
			else if (event.button === 2) {
				isRotating = true;
				lastX = event.clientX;
				lastY = event.clientY;
			}
		}

		function onPointerMove(event) {
			if (isPanning) {
				const deltaX = event.clientX - lastX;
				const deltaY = event.clientY - lastY;

				// We'll translate the camera for a "pan" effect.
				// You can tweak the factor to your liking.
				//camera.position.x += deltaX * 0.02; 
				//camera.position.y += deltaY * 0.02;

				// Or, if you prefer to move the entire rootGroup:
				rootGroup.position.x -= deltaX * 0.015;
				rootGroup.position.y -= deltaY * 0.015;

				lastX = event.clientX;
				lastY = event.clientY;
			} 
			else if (isRotating) {
				const deltaX = event.clientX - lastX;
				const deltaY = event.clientY - lastY;

				// Rotate rootGroup
				rootGroup.rotation.y += deltaX * 0.005;
				rootGroup.rotation.x -= deltaY * 0.005;

				lastX = event.clientX;
				lastY = event.clientY;
			}
		}

		function onPointerUp(event) {
			if (event.button === 0) {
				isPanning = false;
			} else if (event.button === 2) {
				isRotating = false;
			}
		}

		renderer.domElement.addEventListener('pointerdown', onPointerDown);
		renderer.domElement.addEventListener('pointermove', onPointerMove);
		renderer.domElement.addEventListener('pointerup', onPointerUp);
		// In some browsers, pointerup might not catch the event if the mouse leaves the canvas
		// so it's often good practice to add a pointerleave too:
		renderer.domElement.addEventListener('pointerleave', onPointerUp);

		// 12. Handle window resize
		window.addEventListener('resize', () => {
			camera.aspect = container.clientWidth / container.clientHeight;
			camera.updateProjectionMatrix();
			renderer.setSize(container.clientWidth, container.clientHeight);
		});
	});
</script>

<div bind:this={container} class:isVisible></div>

<style>
	div {
		width: 100%;
		height: 100%;
		left: 0%;
		position: absolute;
		visibility: hidden;
		z-index: -1;
	}

	.isVisible {
		visibility: visible !important;
	}
</style>
