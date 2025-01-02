<script>
    import { onMount } from 'svelte';
    import { PerspectiveCamera, Scene, WebGLRenderer, PointLight, ShaderMaterial, BoxGeometry, Mesh, Vector3, Matrix4, Clock } from 'three';
    import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

    import { createEventDispatcher } from 'svelte';

    export let isVisible = false;

    /** Sert à transférer les mouvements de souris aux branches en dessous */
    const dispatch = createEventDispatcher();

    function handlePointerMove(event) {
        dispatch('pointerOverCubeScene', { x: event.clientX, y: event.clientY });
    }

    let container;

    import iridescentCubeVS from '../lib/shaders/iridescentCubeVS.glsl';
    import iridescentCubeFS from '../lib/shaders/iridescentCubeFS.glsl';
    import simpleCubeVS from '../lib/shaders/simpleCubeVS.glsl';
    import simpleCubeFS from '../lib/shaders/simpleCubeFS.glsl';
    
    onMount(async () => {

        const scene = new Scene();
        const camera = new PerspectiveCamera(22.5, container.clientWidth / container.clientHeight, 0.01, 100);
        camera.position.set(-40, 20, -40);

        const renderer = new WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.setClearColor( 0xff0000, 0 );
        container.appendChild(renderer.domElement);

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.target.set(10, -2.5, -2);
        controls.rotateSpeed = 0.2;
        controls.panSpeed = 0.5;
        controls.update();

        const pointLight = new PointLight(0xffffff, 1, 100);
        scene.add(pointLight);

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
        scene.add(iridescentCube);

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
        scene.add(lampCube);

        const clock = new Clock();

        function animate() {
            requestAnimationFrame(animate);

            const elapsedTime = clock.getElapsedTime();

            const orbitRadius = 1.0;
            const angle = elapsedTime;
            lampCube.position.set(
                Math.sin(angle) * orbitRadius,
                Math.sin(angle) * Math.cos(angle) * 1.5,
                Math.cos(angle) * orbitRadius
            );

            pointLight.position.copy(lampCube.position);
            iridescentCubeMaterial.uniforms.lightPosition.value.copy(lampCube.position);
            iridescentCubeMaterial.uniforms.varyingColor.value.set(
                Math.sin(elapsedTime * 3.5) * 0.5 + 0.5,
                Math.sin(elapsedTime * 1.5) * 0.5 + 0.5,
                Math.sin(elapsedTime * 2.5) * 0.5 + 0.5
            );

            controls.update();
            renderer.render(scene, camera);
        }

        animate();

        const onWindowResize = () => {
            camera.aspect = container.clientWidth / container.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(container.clientWidth, container.clientHeight);
        };

        window.addEventListener('resize', onWindowResize);

        return () => {
            window.removeEventListener('resize', onWindowResize);
            container.removeChild(renderer.domElement);
            controls.dispose();
        };
    });
</script>

<style>
    div {
        width: 100%;
        height: 100%;
        left:0%;
        position: absolute;
        visibility: hidden;
        z-index: -1; 
    }

    .isVisible {
        visibility: visible !important;
    }
</style>

<div bind:this={container} on:pointermove={handlePointerMove} class:isVisible></div>
