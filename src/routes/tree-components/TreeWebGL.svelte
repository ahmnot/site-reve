<script>
	//TreeWebGL.svelte
	import { onMount, onDestroy } from 'svelte';
	import { createEventDispatcher } from 'svelte';
	import { magicSeedPositionWritable } from '../../lib/magicSeedPositionStore.js';
	import { shouldFadeOutWebGLSeed } from '../../lib/magicSeedFadeStore.js';
	import { physicsSyncStore } from '../../lib/physicsSyncStore.js';

	export let treeGround = '0';
	export let leftPosition = '50%';
	export let isFirstBranchGrowing = false;
	export let allTheBranches = [];
	export let offsetLeft = 0;
	export let offsetTop = 0;

	let fadeStartTime = null;
	shouldFadeOutWebGLSeed.subscribe((value) => {
		if (value) {
			fadingOut = true;
			fadeStartTime = null;
		}
	});

	const dispatch = createEventDispatcher();

	// WebGL state
	let canvas, containerDiv, gl, program, magicSeedProgram;
	let positionBuffer, animationFrameId;

	// Program locations - cached
	let loc = {
		position: null,
		resolution: null,
		color: null,
		ms_position: null,
		ms_resolution: null,
		ms_time: null,
		ms_seedPosition: null,
		ms_seedSize: null,
		ms_opacity: null,
		ms_rotation: null
	};

	// Branch state
	let branchInstances = [];
	let growthStartTime = 0;
	let maxGrowthOrder = 0;
	let clickedMagicSeed = null;
	let magicSeedOpacity = 1.0;
	let fadingOut = false;
	let dpr = 1;

	// Constants
	const NAMED_COLORS = {
		tan: [0.824, 0.706, 0.549, 1],
		forestgreen: [0.133, 0.545, 0.133, 1],
		thistle: [0.847, 0.749, 0.847, 1],
		mistyrose: [1, 0.894, 0.882, 1],
		darkgoldenrod: [0.722, 0.525, 0.043, 1]
	};

	const DELAY_PER_LEVEL = 50;
	const GROWTH_DURATION = 50;
	const MAGIC_SEED_SIZE = 50;

	// Shaders
	const SHADERS = {
		vertex: `#version 300 es
        in vec2 a_position;
        uniform vec2 u_resolution;
        void main() {
            vec2 clipSpace = (a_position / u_resolution) * 2.0 - 1.0;
            gl_Position = vec4(clipSpace * vec2(1, -1), 0.0, 1.0);
        }
    `,
		fragment: `#version 300 es
        precision mediump float;
        uniform vec4 u_color;
        out vec4 outColor;
        void main() {
            outColor = u_color;
        }
    `,
		msVertex: `#version 300 es
    precision mediump float;
    in vec2 a_position;
    uniform vec2 u_resolution;
    uniform vec2 u_seedPosition;
    uniform vec2 u_seedSize;
    uniform float u_rotation;
    out vec2 v_uv;
    out float v_rotation;
    void main() {
        vec2 clipSpace = (a_position / u_resolution) * 2.0 - 1.0;
        gl_Position = vec4(clipSpace * vec2(1, -1), 0.0, 1.0);
        
        // Calculer les UVs en object space (0 à 1 sur le carré)
        v_uv = (a_position - u_seedPosition) / u_seedSize;
        v_rotation = u_rotation;
    }
`,
		msFragment: `#version 300 es
    precision mediump float;
    in vec2 v_uv;
    in float v_rotation;
    uniform float u_time;
    uniform vec2 u_seedPosition;
    uniform vec2 u_seedSize;
    uniform vec2 u_resolution;
    uniform float u_opacity;
    out vec4 outColor;
    
    vec3 hsl2rgb(vec3 c) {
        vec3 rgb = clamp(abs(mod(c.x * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
        return c.z + c.y * (rgb - 0.5) * (1.0 - abs(2.0 * c.z - 1.0));
    }
    
    float noise(vec2 p) {
        return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
    }
    
    float smoothNoise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        
        float a = noise(i);
        float b = noise(i + vec2(1.0, 0.0));
        float c = noise(i + vec2(0.0, 1.0));
        float d = noise(i + vec2(1.0, 1.0));
        
        return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
    }
    
    vec3 getGradientColor(float t) {
        t = fract(t);
        float colorIndex = t * 6.0;
        float blend = fract(colorIndex);
        blend = blend * blend * (3.0 - 2.0 * blend);
        
        vec3 color1, color2;
        float idx = floor(colorIndex);
        
        if (idx < 1.0) {
            color1 = vec3(2.0/360.0, 1.0, 0.73);
            color2 = vec3(53.0/360.0, 1.0, 0.69);
        } else if (idx < 2.0) {
            color1 = vec3(53.0/360.0, 1.0, 0.69);
            color2 = vec3(93.0/360.0, 1.0, 0.69);
        } else if (idx < 3.0) {
            color1 = vec3(93.0/360.0, 1.0, 0.69);
            color2 = vec3(176.0/360.0, 1.0, 0.76);
        } else if (idx < 4.0) {
            color1 = vec3(176.0/360.0, 1.0, 0.76);
            color2 = vec3(228.0/360.0, 1.0, 0.74);
        } else if (idx < 5.0) {
            color1 = vec3(228.0/360.0, 1.0, 0.74);
            color2 = vec3(283.0/360.0, 1.0, 0.73);
        } else {
            color1 = vec3(283.0/360.0, 1.0, 0.73);
            color2 = vec3(2.0/360.0, 1.0, 0.73);
        }
        
        vec3 hslColor = mix(color1, color2, blend);
        return hsl2rgb(hslColor);
    }
    
    // Fonction de rotation 2D
    vec2 rotate2D(vec2 v, float angle) {
        float s = sin(angle);
        float c = cos(angle);
        return vec2(v.x * c - v.y * s, v.x * s + v.y * c);
    }
    
    void main() {
        // Centrer les UVs : va de -0.5 à 0.5
        vec2 centeredUV = v_uv - 0.5;
        
        // Appliquer la rotation INVERSE pour que le contenu tourne avec le carré
        vec2 rotatedUV = rotate2D(centeredUV, -v_rotation);
        
        // Normaliser pour le gradient : va de -1 à 1
        vec2 localPos = rotatedUV * 2.0;
        
        float angle = radians(135.0);
        vec2 gradientDir = vec2(cos(angle), sin(angle));
        float gradientPos = dot(localPos, gradientDir);
        gradientPos = gradientPos / 10.0;
        
        float t = fract(u_time * 0.0005);
        float oscillation = sin(u_time * 0.0005) * 0.15;

        vec2 noiseCoord = localPos * 6.0 + u_time * 0.0001;
        float noiseValue = smoothNoise(noiseCoord);
        
        float noiseAmount = 0.03;
        gradientPos += (noiseValue - 0.5) * noiseAmount;

        float finalPos = gradientPos + oscillation + 0.35;
        
        vec3 rgbColor = getGradientColor(finalPos);
        outColor = vec4(rgbColor, u_opacity);
    }
`
	};

	// Utility functions
	const createShader = (type, source) => {
		const shader = gl.createShader(type);
		gl.shaderSource(shader, source);
		gl.compileShader(shader);
		if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
			console.error('Shader error:', gl.getShaderInfoLog(shader));
			gl.deleteShader(shader);
			return null;
		}
		return shader;
	};

	const createProgram = (vs, fs) => {
		const program = gl.createProgram();
		gl.attachShader(program, vs);
		gl.attachShader(program, fs);
		gl.linkProgram(program);
		if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
			console.error('Program error:', gl.getProgramInfoLog(program));
			gl.deleteProgram(program);
			return null;
		}
		return program;
	};

	const parseCSSValue = (value) => {
		if (typeof value === 'number') return value;
		if (typeof value !== 'string') return 0;

		value = value.trim();
		const num = parseFloat(value);

		if (value.endsWith('vw')) return (num / 100) * window.innerWidth;
		if (value.endsWith('vh')) return (num / 100) * window.innerHeight;
		return num || 0;
	};

	const colorToRgba = (color) => NAMED_COLORS[color.toLowerCase()] || [0.5, 0.5, 0.5, 1.0];

	// Branch flattening
	function flattenBranches(branches, parentX = 0, parentY = 0, parentRotation = 0, depth = 0) {
		const instances = [];
		const PI_180 = Math.PI / 180;

		for (const branch of branches) {
			const rotation = parseCSSValue(branch.rotation);
			const length = parseCSSValue(branch.length) * dpr;
			const width = parseCSSValue(branch.width) * dpr;
			const windIntensity = parseCSSValue(branch.windIntensity) * dpr;

			const totalRotation = parentRotation + rotation;
			const radians = totalRotation * PI_180;
			const sinR = Math.sin(radians);
			const cosR = Math.cos(radians);

			const endX = parentX + sinR * length;
			const endY = parentY - cosR * length;

			instances.push({
				id: branch.id,
				x: parentX,
				y: parentY,
				endX,
				endY,
				width,
				length,
				rotation: totalRotation,
				absoluteRotation: radians,
				sinR,
				cosR,
				magicSeedRotationDegrees: branch.magicseed ? rotation : 0,
				color: branch.color || 'tan',
				zIndex: branch.zIndex || 0,
				magicseed: branch.magicseed || false,
				matterBody: branch.matterBody || null, // Référence au body Matter.js
				windIntensity,
				windy: branch.windy || false,
				swayOnHover: branch.swayOnHover || false,
				growing: false,
				growthProgress: 0,
				growthOrder: depth,
				windPhase: Math.random() * Math.PI * 2,
				depth
			});

			if (branch.childBranches?.length) {
				instances.push(
					...flattenBranches(branch.childBranches, endX, endY, totalRotation, depth + 1)
				);
			}
		}

		return instances;
	}

	// Rendering
	function resizeCanvas() {
		if (!canvas || !containerDiv) return;

		dpr = window.devicePixelRatio || 1;
		const width = window.innerWidth;
		const height = window.innerHeight;

		canvas.style.width = `${width}px`;
		canvas.style.height = `${height}px`;
		canvas.width = width * dpr;
		canvas.height = height * dpr;

		if (gl) {
			gl.viewport(0, 0, canvas.width, canvas.height);
		}

		if (allTheBranches.length > 0) {
			updateBranchPositions();
		}
	}

	function updateBranchPositions() {
		if (!canvas || !allTheBranches.length) return;

		const treeGroundPx = parseCSSValue(treeGround);
		const startX = offsetLeft * dpr;
		const startY = (offsetTop + treeGroundPx) * dpr;

		branchInstances = flattenBranches(allTheBranches, startX, startY, 0, 0);
		maxGrowthOrder = Math.max(...branchInstances.map((b) => b.growthOrder));
	}

	// Reusable position array
	const positions = new Float32Array(12);

	function drawMagicSeed(instance, time) {
		// Si la physique est active et c'est cette instance, utiliser physicsBody
		let centerX, centerY, angle;

		if (physicsActive && physicsBody && physicsBody.instance === instance) {
			centerX = physicsBody.x; // Directement le centre
			centerY = physicsBody.y;
			angle = physicsBody.angle;
		} else {
			const size = MAGIC_SEED_SIZE * dpr;
			const halfSize = size / 2;
			const rotRad = (instance.magicSeedRotationDegrees * Math.PI) / 180;
			const cos = Math.cos(rotRad);
			const sin = Math.sin(rotRad);
			centerX = instance.x + halfSize * (cos - sin);
			centerY = instance.y + halfSize * (sin + cos);
			angle = (instance.magicSeedRotationDegrees * Math.PI) / 180;
		}

		const size = MAGIC_SEED_SIZE * dpr;
		const halfSize = size / 2;
		const cos = Math.cos(angle);
		const sin = Math.sin(angle);

		// Compute corners autour du centre
		const c = [
			[centerX - halfSize * cos + halfSize * sin, centerY - halfSize * sin - halfSize * cos],
			[centerX + halfSize * cos + halfSize * sin, centerY + halfSize * sin - halfSize * cos],
			[centerX - halfSize * cos - halfSize * sin, centerY - halfSize * sin + halfSize * cos],
			[centerX + halfSize * cos - halfSize * sin, centerY + halfSize * sin + halfSize * cos]
		];

		positions.set([
			c[0][0],
			c[0][1],
			c[1][0],
			c[1][1],
			c[2][0],
			c[2][1],
			c[2][0],
			c[2][1],
			c[1][0],
			c[1][1],
			c[3][0],
			c[3][1]
		]);

		gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
		gl.useProgram(magicSeedProgram);

		gl.uniform2f(loc.ms_resolution, canvas.width, canvas.height);
		gl.uniform1f(loc.ms_time, time);
		gl.uniform2f(loc.ms_seedPosition, centerX - halfSize, centerY - halfSize);
		gl.uniform2f(loc.ms_seedSize, size, size);
		gl.uniform1f(loc.ms_opacity, magicSeedOpacity);
		gl.uniform1f(loc.ms_rotation, angle);  // NOUVEAU : passer l'angle

		gl.vertexAttribPointer(loc.ms_position, 2, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(loc.ms_position);
		gl.drawArrays(gl.TRIANGLES, 0, 6);
	}

	function drawBranch(instance, time) {
		const {
			x,
			y,
			endX,
			endY,
			width,
			color,
			growing,
			growthProgress,
			windIntensity,
			windy,
			windPhase,
			sinR,
			cosR,
			magicseed
		} = instance;

		if (growing && growthProgress === 0) return;

		// CHANGEMENT ICI : Ne pas cacher la branche si c'est la MagicSeed qui a été cliquée
		// On cache UNIQUEMENT la MagicSeed elle-même
		if (magicseed && clickedMagicSeed) return;

		if (magicseed) {
			drawMagicSeed(instance, time);
			return;
		}

		const currentLength = growing ? growthProgress : 1;
		const currentEndX = x + (endX - x) * currentLength;
		const currentEndY = y + (endY - y) * currentLength;

		let windOffsetX = 0;
		if (windy && windIntensity > 0 && (!growing || growthProgress > 0)) {
			windOffsetX = Math.sin(time * 0.002 + windPhase) * windIntensity * sinR;
		}

		const halfWidth = width / 2;
		const perpX = -cosR * halfWidth;
		const perpY = -sinR * halfWidth;

		positions.set([
			x + perpX,
			y + perpY,
			x - perpX,
			y - perpY,
			currentEndX + perpX + windOffsetX,
			currentEndY + perpY,
			currentEndX + perpX + windOffsetX,
			currentEndY + perpY,
			x - perpX,
			y - perpY,
			currentEndX - perpX + windOffsetX,
			currentEndY - perpY
		]);

		gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
		gl.useProgram(program);

		gl.uniform2f(loc.resolution, canvas.width, canvas.height);
		gl.uniform4fv(loc.color, colorToRgba(color));

		gl.vertexAttribPointer(loc.position, 2, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(loc.position);
		gl.drawArrays(gl.TRIANGLES, 0, 6);
	}

	function render(time) {
		if (!gl) return;

		gl.clearColor(0, 0, 0, 0);
		gl.clear(gl.COLOR_BUFFER_BIT);

		const timeSinceStart = time - growthStartTime;

		// SYNCHRONISER avec la physique de Matter.js depuis BoxWithAWordWithNuageTarget
		let physicsSync;
		physicsSyncStore.subscribe((value) => {
			physicsSync = value;
		})();

		if (physicsSync && physicsSync.active && physicsBody) {
			// Mettre à jour la position locale pour le rendu
			physicsBody.x = physicsSync.x * dpr;
			physicsBody.y = physicsSync.y * dpr;
			physicsBody.angle = physicsSync.angle;

			// Vérifier si la graine a touché le sol
			if (physicsSync.grounded && !physicsBody.grounded) {
				physicsBody.grounded = true;

				// Attendre avant de faire disparaître
				setTimeout(() => {
					handleMagicSeedLanded();
				}, 2000);
			}
		}

		// Gérer le fondu de disparition
		if (fadingOut) {
			if (!fadeStartTime) {
				fadeStartTime = time;
			}

			const fadeDuration = 1000;
			const elapsed = time - fadeStartTime;

			if (elapsed < fadeDuration) {
				magicSeedOpacity = 1.0 - elapsed / fadeDuration;
			} else {
				magicSeedOpacity = 0;
				if (!clickedMagicSeed && physicsBody) {
					clickedMagicSeed = physicsBody.instance;
				}
			}
		}

		for (const instance of branchInstances) {
			if (instance.growing && instance.growthProgress < 1) {
				const startTime = instance.growthOrder * DELAY_PER_LEVEL;
				instance.growthProgress =
					timeSinceStart >= startTime
						? Math.min(1, (timeSinceStart - startTime) / GROWTH_DURATION)
						: 0;
			}
		}

		const sorted = [...branchInstances].sort((a, b) => a.zIndex - b.zIndex);

		for (const instance of sorted) {
			drawBranch(instance, time);
		}

		animationFrameId = requestAnimationFrame(render);
	}

	let physicsActive = false;
	let physicsBody = null;

	// Interactions
	function handleCanvasClick(e) {
		const rect = canvas.getBoundingClientRect();
		const clickX = (e.clientX - rect.left) * dpr;
		const clickY = (e.clientY - rect.top) * dpr;

		for (const b of branchInstances) {
			if (!b.magicseed) continue;

			const size = MAGIC_SEED_SIZE * dpr;
			const halfSize = size / 2;
			const rotRad = (b.magicSeedRotationDegrees * Math.PI) / 180;
			const cos = Math.cos(rotRad);
			const sin = Math.sin(rotRad);
			const centerX = b.x + halfSize * (cos - sin);
			const centerY = b.y + halfSize * (sin + cos);

			if (Math.abs(centerX - clickX) < halfSize && Math.abs(centerY - clickY) < halfSize) {
				// Calculer la position en pixels (pas en DPR)
				const pixelX = centerX / dpr;
				const pixelY = centerY / dpr;
				const angleDegrees = b.magicSeedRotationDegrees;

				// Enregistrer la position pour BoxWithAWordWithNuageTarget
				magicSeedPositionWritable.set({
					top: pixelY - 25,
					left: pixelX - 25,
					angle: angleDegrees
				});

				// Activer la physique locale pour le suivi
				physicsActive = true;
				physicsBody = {
					x: centerX,
					y: centerY,
					angle: (angleDegrees * Math.PI) / 180,
					grounded: false,
					instance: b
				};

				b.falling = true;

				// Dispatcher l'événement pour déclencher la MagicSeed Svelte
				dispatch('branchMagicSeedWasClicked');

				break;
			}
		}
	}

	function handleMagicSeedLanded() {
		fadingOut = true;
		fadeStartTime = null;

		const finalX = physicsSyncStore.x;
		const finalY = physicsSyncStore.y;

		magicSeedPositionWritable.set({
			top: finalY - 50,
			left: finalX - 25,
			angle: (physicsSyncStore.angle * 180) / Math.PI
		});

		dispatch('branchMagicSeedWasClicked');

		setTimeout(() => {
			clickedMagicSeed = physicsBody.instance;
			physicsActive = false;
			physicsBody = null;
		}, 200);
	}

	// Reactive statements
	$: if (isFirstBranchGrowing && branchInstances.length > 0) {
		growthStartTime = performance.now();
		branchInstances.forEach((instance) => {
			instance.growing = true;
			instance.growthProgress = 0;
		});
	}

	$: if (
		offsetLeft !== undefined &&
		offsetTop !== undefined &&
		allTheBranches.length > 0 &&
		canvas
	) {
		updateBranchPositions();
	}

	// Lifecycle
	onMount(() => {
		gl = canvas.getContext('webgl2', {
			// <-- webgl2 au lieu de webgl
			alpha: true,
			premultipliedAlpha: true,
			antialias: true,
			depth: false,
			stencil: false
		});

		if (!gl) {
			console.error('WebGL 2 non supporté, essai WebGL 1...');
			// Fallback vers WebGL 1
			gl = canvas.getContext('webgl', {
				alpha: true,
				premultipliedAlpha: true,
				antialias: true,
				depth: false,
				stencil: false
			});

			if (!gl) {
				console.error('WebGL non supporté');
				return;
			}
		}

		// Create programs
		const vs = createShader(gl.VERTEX_SHADER, SHADERS.vertex);
		const fs = createShader(gl.FRAGMENT_SHADER, SHADERS.fragment);
		program = createProgram(vs, fs);

		const msVs = createShader(gl.VERTEX_SHADER, SHADERS.msVertex);
		const msFs = createShader(gl.FRAGMENT_SHADER, SHADERS.msFragment);
		magicSeedProgram = createProgram(msVs, msFs);

		// Cache locations
		loc.position = gl.getAttribLocation(program, 'a_position');
		loc.resolution = gl.getUniformLocation(program, 'u_resolution');
		loc.color = gl.getUniformLocation(program, 'u_color');
		loc.ms_position = gl.getAttribLocation(magicSeedProgram, 'a_position');
		loc.ms_resolution = gl.getUniformLocation(magicSeedProgram, 'u_resolution');
		loc.ms_time = gl.getUniformLocation(magicSeedProgram, 'u_time');
		loc.ms_seedPosition = gl.getUniformLocation(magicSeedProgram, 'u_seedPosition');
		loc.ms_seedSize = gl.getUniformLocation(magicSeedProgram, 'u_seedSize');
		loc.ms_opacity = gl.getUniformLocation(magicSeedProgram, 'u_opacity');
		loc.ms_rotation = gl.getUniformLocation(magicSeedProgram, 'u_rotation');

		positionBuffer = gl.createBuffer();

		gl.enable(gl.BLEND);
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

		setTimeout(resizeCanvas, 100);
		window.addEventListener('resize', resizeCanvas);
		canvas.addEventListener('click', handleCanvasClick);
		canvas.addEventListener('touchstart', handleCanvasClick, { passive: true });

		animationFrameId = requestAnimationFrame(render);
	});

	onDestroy(() => {
		if (animationFrameId) cancelAnimationFrame(animationFrameId);
		window.removeEventListener('resize', resizeCanvas);

		if (canvas) {
			canvas.removeEventListener('click', handleCanvasClick);
			canvas.removeEventListener('touchstart', handleCanvasClick);
		}

		if (gl) {
			gl.deleteProgram(program);
			gl.deleteProgram(magicSeedProgram);
			gl.deleteBuffer(positionBuffer);
		}
	});
</script>

<div class="tree-container" bind:this={containerDiv}>
	<canvas bind:this={canvas}></canvas>
</div>

<style>
	.tree-container {
		position: absolute;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		pointer-events: all;
	}

	canvas {
		width: 100%;
		height: 100%;
		display: block;
		cursor: pointer;
	}
</style>
