<script>
    import { onMount } from 'svelte';
    import { PerspectiveCamera, Scene, WebGLRenderer, PointLight, ShaderMaterial, BoxGeometry, Mesh, Vector3, Matrix4, Clock } from 'three';
    import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

    let container;

    const loadShader = async (url) => {
        const response = await fetch(url);
        return response.text();
    };

    onMount(async () => {
        const iridescentCubeVS = await loadShader('src/lib/shaders/iridescentCubeVS.glsl');
        const iridescentCubeFS = await loadShader('src/lib/shaders/iridescentCubeFS.glsl');
        const simpleCubeVS = await loadShader('src/lib/shaders/simpleCubeVS.glsl');
        const simpleCubeFS = await loadShader('src/lib/shaders/simpleCubeFS.glsl');

        const scene = new Scene();
        const camera = new PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.01, 100);
        camera.position.set(-3, 2.5, -3);

        const renderer = new WebGLRenderer({ antialias: true });
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.setClearColor(0xffe4c4);
        container.appendChild(renderer.domElement);

        const controls = new OrbitControls(camera, renderer.domElement);

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
        position: relative;
    }
</style>

<div bind:this={container}></div>
