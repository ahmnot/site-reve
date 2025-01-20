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
		Clock,
		EdgesGeometry,
		LineDashedMaterial,
		LineSegments
	} from 'three';
	import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
	import { Group } from 'three';

	export let isVisible = false;

	let container;

	// Shaders existants
	import iridescentCubeVS from '../lib/shaders/iridescentCubeVS.glsl';
	import iridescentCubeFS from '../lib/shaders/iridescentCubeFS.glsl';
	import simpleCubeVS from '../lib/shaders/simpleCubeVS.glsl';
	import simpleCubeFS from '../lib/shaders/simpleCubeFS.glsl';

	onMount(async () => {
		// 1. Créer la scène et la caméra
		const scene = new Scene();
		const camera = new PerspectiveCamera(
			22.5,
			container.clientWidth / container.clientHeight,
			0.01,
			100
		);
		camera.position.set(0, 0, -40); // Position de la caméra

		// 2. Créer le renderer
		const renderer = new WebGLRenderer({ antialias: true, alpha: true });
		renderer.setSize(container.clientWidth, container.clientHeight);
		renderer.setClearColor(0xff0000, 0); // fond transparent
		container.appendChild(renderer.domElement);

		// 3. (Optionnel) OrbitControls
		const controls = new OrbitControls(camera, renderer.domElement);
		controls.enableRotate = false; 
		controls.enablePan = false;
		controls.enableZoom = true;
		controls.target.set(4, 0, 0);
		controls.update();

		// 4. Groupe racine
		const rootGroup = new Group();
		scene.add(rootGroup);

		// 5. Groupe pour nos objets en "orbite"
		const orbitGroup = new Group();
		rootGroup.add(orbitGroup);

		// 6. Cube principal (iridescent)
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

		// 7. Petit cube qui représente la lampe
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

		// 8. Lumière ponctuelle
		const pointLight = new PointLight(0xffffff, 1, 100);
		orbitGroup.add(pointLight);

		// ------------------------------
		// *** Nouveau : 1 "cube" statique en haut à gauche ***
		// version "arêtes en pointillés"
		// ------------------------------

		// a) Géométrie de base
		const staticCubeGeometry = new BoxGeometry(1, 1, 1); // Même taille que le cube principal

		// b) On génère la géométrie des arêtes à partir du cube
		const edgesGeometry = new EdgesGeometry(staticCubeGeometry);

		// c) Crée un matériau "LineDashedMaterial" pour avoir un effet pointillé
		const outlineMaterial = new LineDashedMaterial({
			color: 0xd2b48c,  // noir
			dashSize: 0.05,    // longueur de chaque tiret
			gapSize: 0.15,     // espace entre tirets
			linewidth: 1      // épaisseur (souvent ignoré selon la plateforme)
		});

		// d) On crée le LineSegments qui va porter ces arêtes
		const staticCube1 = new LineSegments(edgesGeometry, outlineMaterial);

		// e) Nécessaire pour activer le pattern "dashed"
		staticCube1.computeLineDistances();

		// f) Position "en bas à gauche" (ou gauche, selon tes coordonnées)
		staticCube1.position.set(10, -5, 0);

		// g) Appliquer une rotation statique
		staticCube1.rotation.x = Math.PI / 4; 
		staticCube1.rotation.z = Math.PI / 4; 

		// h) On l'ajoute directement à la scène pour qu'il reste statique
		scene.add(staticCube1);

		// 9. Clock pour l'animation (uniquement pour les objets qui bougent)
		const clock = new Clock();

		// 10. Boucle d'animation
		function animate() {
			requestAnimationFrame(animate);

			const elapsedTime = clock.getElapsedTime();

			// --- Mouvement du lampCube autour du cube iridescent ---
			const orbitRadius = 1.0;
			const angle = elapsedTime;
			lampCube.position.set(
				Math.sin(angle) * orbitRadius,
				Math.sin(angle) * Math.cos(angle) * 1.5,
				Math.cos(angle) * orbitRadius
			);

			// Mise à jour de la position de la lumière
			const worldPosition = new Vector3();
			lampCube.getWorldPosition(worldPosition);
			pointLight.position.copy(worldPosition);

			// Mise à jour de la position de la lumière pour le shader iridescent
			iridescentCubeMaterial.uniforms.lightPosition.value.copy(worldPosition);

			// Mise à jour couleur "iridescente"
			iridescentCubeMaterial.uniforms.varyingColor.value.set(
				Math.sin(elapsedTime * 3.5) * 0.5 + 0.5,
				Math.sin(elapsedTime * 1.5) * 0.5 + 0.5,
				Math.sin(elapsedTime * 2.5) * 0.5 + 0.5
			);

			// Le nouveau cube (staticCube1) n'est pas animé

			renderer.render(scene, camera);
		}
		animate();

		// 11. Logique pour panning/rotation (click gauche/droit)
		let isPanning = false;
		let isRotating = false;
		let lastX = 0;
		let lastY = 0;

		function onPointerDown(event) {
			if (event.button === 2) {
				event.preventDefault();
			}
			if (event.button === 0) {
				isPanning = true;
				lastX = event.clientX;
				lastY = event.clientY;
			} else if (event.button === 2) {
				isRotating = true;
				lastX = event.clientX;
				lastY = event.clientY;
			}
		}

		function onPointerMove(event) {
			if (isPanning) {
				const deltaX = event.clientX - lastX;
				const deltaY = event.clientY - lastY;
				rootGroup.position.x -= deltaX * 0.015;
				rootGroup.position.y -= deltaY * 0.015;
				lastX = event.clientX;
				lastY = event.clientY;
			} 
			else if (isRotating) {
				const deltaX = event.clientX - lastX;
				const deltaY = event.clientY - lastY;
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
		renderer.domElement.addEventListener('pointerleave', onPointerUp);

		// 12. Gestion du redimensionnement fenêtre
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
