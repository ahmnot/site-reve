<script>
	// NegativeCube3DScene.svelte
	import { onMount, onDestroy } from 'svelte';
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

	// Shaders existants
	import iridescentCubeVS from '../lib/shaders/iridescentCubeVS.glsl';
	import iridescentCubeFS from '../lib/shaders/iridescentCubeFS.glsl';
	import simpleCubeVS from '../lib/shaders/simpleCubeVS.glsl';
	import simpleCubeFS from '../lib/shaders/simpleCubeFS.glsl';
	
	import { showTextInput } from '../lib/textInputStore.js';

	export let isVisible = false;

	let container;
	let renderer;
	let iridescentCubeGeometry;
	let iridescentCubeMaterial;
	let lampCubeGeometry;
	let lampCubeMaterial;
	let edgesGeometry;
	let outlineMaterial;
	let rafId; // Pour stocker l'ID de requestAnimationFrame

	onMount(async () => {
		// 1. Créer la scène et la caméra
		const scene = new Scene();
		const camera = new PerspectiveCamera(
			22.5,
			container.clientWidth / container.clientHeight,
			0.01,
			100
		);
		camera.position.set(0, 0, -50); // Position de la caméra

		// 2. Créer le renderer
		const renderer = new WebGLRenderer({ antialias: true, alpha: true });
		renderer.setSize(container.clientWidth, container.clientHeight);
		renderer.setClearColor(0xff0000, 0); // fond transparent
		container.appendChild(renderer.domElement);

		// 3. (Optionnel) OrbitControls
		const controls = new OrbitControls(camera, renderer.domElement);
		controls.enableRotate = false;
		controls.enablePan = false;
		controls.enableZoom = false;
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

		function checkCubeMatch() {
			// Marge de tolérance pour la position et la rotation
			const positionTolerance = 0.1; // Tolérance pour les positions
			const rotationTolerance = 0.1; // Tolérance pour les rotations (en radians)

			// Calcul de positionMatch
			const positionMatch =
				Math.abs(rootGroup.position.x - linedCube.position.x) < positionTolerance &&
				Math.abs(rootGroup.position.y - linedCube.position.y) < positionTolerance &&
				Math.abs(rootGroup.position.z - linedCube.position.z) < positionTolerance;

			// Calcul de rotationMatch
			const rotationMatch =
				Math.abs(Math.abs(rootGroup.rotation.x) - Math.abs(linedCube.rotation.x)) <
					rotationTolerance &&
				Math.abs(Math.abs(rootGroup.rotation.y) - Math.abs(linedCube.rotation.y)) <
					rotationTolerance &&
				Math.abs(Math.abs(rootGroup.rotation.z) - Math.abs(linedCube.rotation.z)) <
					rotationTolerance;

			// Vérification du match
			if (positionMatch && rotationMatch) {
				showTextInput.set(true);
			} else {
				showTextInput.set(false);
			}
		}

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
		// *** Nouveau : 1 "cube" statique en bas à gauche ***
		// version "arêtes en pointillés"
		// ------------------------------

		// a) Géométrie de base
		const staticCubeGeometry = new BoxGeometry(1, 1, 1); // Même taille que le cube principal

		// b) On génère la géométrie des arêtes à partir du cube
		const edgesGeometry = new EdgesGeometry(staticCubeGeometry);

		// c) Crée un matériau "LineDashedMaterial" pour avoir un effet pointillé
		const outlineMaterial = new LineDashedMaterial({
			color: 0xd3d3d3,
			dashSize: 0.15, // longueur de chaque tiret
			gapSize: 0.25, // espace entre tirets
			linewidth: 1, // épaisseur (souvent ignoré selon la plateforme)
			transparent: true, // Permet la transparence
			opacity: 1.0 // Valeur initiale de l'opacité
		});

		// d) On crée le LineSegments qui va porter ces arêtes
		const linedCube = new LineSegments(edgesGeometry, outlineMaterial);

		// e) Nécessaire pour activer le pattern "dashed"
		linedCube.computeLineDistances();

		// f) Position "en bas à gauche" (ou gauche, selon tes coordonnées)
		linedCube.position.set(10, -5, 0);

		// g) Appliquer une rotation statique
		linedCube.rotation.x = Math.PI / 4;
		linedCube.rotation.y = Math.PI / 4;

		// h) On l'ajoute directement à la scène pour qu'il reste statique
		scene.add(linedCube);

		// 9. Clock pour l'animation (uniquement pour les objets qui bougent)
		const clock = new Clock();

		// 10. Boucle d'animation
		// Animation de l'opacité pour le linedCube
		const pulseSpeed = 3; // Vitesse de la pulsation
		const minOpacity = 0.1; // Opacité minimale (transparence)
		const maxOpacity = 0.9; // Opacité maximale (gris clair)
		const orbitRadius = 1.0;

		const tempWorldPos = new Vector3();

		function animate() {
			// Vérifier isVisible directement dans la boucle
			if (!isVisible) {
				rafId = requestAnimationFrame(animate);
				return; // Ne pas render mais continuer la boucle
			}
			requestAnimationFrame(animate);

			const elapsedTime = clock.getElapsedTime();

			// --- Mouvement du lampCube autour du cube iridescent ---
			const angle = elapsedTime;

			// Animation de la pulsation
			const pulseOpacity =
				(Math.sin(elapsedTime * pulseSpeed) * 0.5 + 0.5) * (maxOpacity - minOpacity) + minOpacity;

			outlineMaterial.opacity = pulseOpacity; // Mise à jour de l'opacité

			// Autres animations
			lampCube.position.set(
				Math.sin(elapsedTime) * orbitRadius,
				Math.sin(elapsedTime) * Math.cos(elapsedTime) * 1.5,
				Math.cos(elapsedTime) * orbitRadius
			);

			pointLight.position.copy(lampCube.position);

			iridescentCubeMaterial.uniforms.varyingColor.value.set(
				Math.sin(elapsedTime * 3.5) * 0.5 + 0.5,
				Math.sin(elapsedTime * 1.5) * 0.5 + 0.5,
				Math.sin(elapsedTime * 2.5) * 0.5 + 0.5
			);

			// Récupérer la position monde du lampCube :
			lampCube.getWorldPosition(tempWorldPos);

			// Et mettre à jour l'uniform :
			iridescentCubeMaterial.uniforms.lightPosition.value.copy(tempWorldPos);

			checkCubeMatch();

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
			} else if (isRotating) {
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

		function handleResize() {
			camera.aspect = container.clientWidth / container.clientHeight;
			camera.updateProjectionMatrix();
			renderer.setSize(container.clientWidth, container.clientHeight);
		}

		// 12. Gestion du redimensionnement fenêtre
		window.addEventListener('resize', handleResize);

		// Cleanup dans onDestroy
		return () => {
			window.removeEventListener('resize', handleResize);
			renderer.domElement.removeEventListener('pointerdown', onPointerDown);
			renderer.domElement.removeEventListener('pointermove', onPointerMove);
			renderer.domElement.removeEventListener('pointerup', onPointerUp);
			renderer.domElement.removeEventListener('pointerleave', onPointerUp);
		};
	});

	// Cleanup proper dans onDestroy
	onDestroy(() => {
		if (rafId) {
			cancelAnimationFrame(rafId);
		}
		if (renderer) {
			renderer.dispose();
		}
		if (iridescentCubeGeometry) {
			iridescentCubeGeometry.dispose();
		}
		if (iridescentCubeMaterial) {
			iridescentCubeMaterial.dispose();
		}
		if (lampCubeGeometry) {
			lampCubeGeometry.dispose();
		}
		if (lampCubeMaterial) {
			lampCubeMaterial.dispose();
		}
		if (edgesGeometry) {
			edgesGeometry.dispose();
		}
		if (outlineMaterial) {
			outlineMaterial.dispose();
		}
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
