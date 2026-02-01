<script>
	// TreeWebGL.svelte
	import { onMount, onDestroy } from 'svelte';
	import { createEventDispatcher } from 'svelte';
	import { magicSeedPositionWritable } from '../../lib/magicSeedPositionStore.js';
	import { generateBranches, resetBranchGeneration } from '../../lib/branchesStore.js';

	export let treeGround = '0';
	export let leftPosition = '50%';
	export let isFirstBranchGrowing = false;
	export let allTheBranches = [];
	export let offsetLeft = 0; // NOUVEAU
	export let offsetTop = 0; // NOUVEAU

	const dispatch = createEventDispatcher();

	let canvas;
	let containerDiv;
	let gl;
	let program;
	let positionLocation;
	let resolutionLocation;
	let colorLocation;
	let positionBuffer;
	let animationFrameId;
	let branchInstances = [];
	let growthStartTime = 0;
	let maxGrowthOrder = 0;
	let clickedMagicSeed = null;

	// ============================================
	// SHADERS
	// ============================================

	const vertexShaderSource = `
		attribute vec2 a_position;
		uniform vec2 u_resolution;
		
		void main() {
			vec2 clipSpace = (a_position / u_resolution) * 2.0 - 1.0;
			gl_Position = vec4(clipSpace * vec2(1, -1), 0.0, 1.0);
		}
	`;

	const fragmentShaderSource = `
		precision mediump float;
		uniform vec4 u_color;
		
		void main() {
			gl_FragColor = u_color;
		}
	`;

	const magicSeedVertexShaderSource = `
	precision mediump float;  // AJOUTER CETTE LIGNE
	attribute vec2 a_position;
	uniform vec2 u_resolution;
	varying vec2 v_uv;
	
	void main() {
		vec2 clipSpace = (a_position / u_resolution) * 2.0 - 1.0;
		gl_Position = vec4(clipSpace * vec2(1, -1), 0.0, 1.0);
		
		// Calculer les coordonnées UV (0 à 1)
		v_uv = a_position / u_resolution;
	}
`;

	const magicSeedFragmentShaderSource = `
	precision mediump float;
	varying vec2 v_uv;
	uniform float u_time;
	uniform vec2 u_seedPosition;
	uniform vec2 u_seedSize;
	uniform vec2 u_resolution;
	
	// Convertir HSL en RGB
	vec3 hsl2rgb(vec3 c) {
		vec3 rgb = clamp(abs(mod(c.x * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
		return c.z + c.y * (rgb - 0.5) * (1.0 - abs(2.0 * c.z - 1.0));
	}
	
	// Fonction pour obtenir une couleur du gradient
	vec3 getGradientColor(float t) {
		t = fract(t);
		
		float colorIndex = t * 6.0;
		float blend = fract(colorIndex);
		
		// Ease-in-out
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
	
	void main() {
		// IMPORTANT : Utiliser gl_FragCoord directement (position absolue dans le canvas)
		// au lieu de seedUV (position relative à la seed)
		// Cela simule le background-size: 400% 400%
		
		// Angle de 135 degrés = direction du gradient
		float angle = radians(135.0);
		vec2 gradientDir = vec2(cos(angle), sin(angle));
		
		// Position absolue dans le canvas (normalisée)
		vec2 absolutePos = gl_FragCoord.xy / u_resolution;
		
		// Position sur le gradient
		// Multiplier par 0.25 pour simuler background-size: 400%
		float gradientPos = dot(absolutePos, gradientDir) * 0.125;
		
		// Animation : décaler le gradient
		float animOffset = u_time * 0.0001;
		animOffset = fract(animOffset);
		
		// Position finale dans le gradient
		float finalPos = gradientPos - animOffset;
		
		vec3 rgbColor = getGradientColor(finalPos);
		
		gl_FragColor = vec4(rgbColor, 1.0);
	}
`;

	// ============================================
	// HELPERS
	// ============================================

	function createShader(gl, type, source) {
		const shader = gl.createShader(type);
		gl.shaderSource(shader, source);
		gl.compileShader(shader);

		if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
			console.error('Erreur compilation shader:', gl.getShaderInfoLog(shader));
			gl.deleteShader(shader);
			return null;
		}
		return shader;
	}

	function createProgram(gl, vertexShader, fragmentShader) {
		const program = gl.createProgram();
		gl.attachShader(program, vertexShader);
		gl.attachShader(program, fragmentShader);
		gl.linkProgram(program);

		if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
			console.error('Erreur link program:', gl.getProgramInfoLog(program));
			gl.deleteProgram(program);
			return null;
		}
		return program;
	}

	function parseCSSValue(value, contextSize = 100) {
		if (typeof value === 'number') return value;
		if (typeof value !== 'string') return 0;

		value = value.trim();

		if (value.endsWith('px')) {
			return parseFloat(value);
		} else if (value.endsWith('vw')) {
			return (parseFloat(value) / 100) * window.innerWidth;
		} else if (value.endsWith('vh')) {
			return (parseFloat(value) / 100) * window.innerHeight;
		} else if (value.endsWith('deg')) {
			return parseFloat(value);
		} else {
			return parseFloat(value) || 0;
		}
	}

	function colorToRgba(color) {
		const namedColors = {
			tan: [210 / 255, 180 / 255, 140 / 255, 1],
			forestgreen: [34 / 255, 139 / 255, 34 / 255, 1],
			thistle: [216 / 255, 191 / 255, 216 / 255, 1],
			mistyrose: [255 / 255, 228 / 255, 225 / 255, 1],
			darkgoldenrod: [184 / 255, 134 / 255, 11 / 255, 1]
		};

		return namedColors[color.toLowerCase()] || [0.5, 0.5, 0.5, 1.0];
	}

	// ============================================
	// FLATTEN BRANCHES
	// ============================================

	function flattenBranches(branches, parentX = 0, parentY = 0, parentRotation = 0, depth = 0) {
		const instances = [];
		const dpr = window.devicePixelRatio || 1;

		branches.forEach((branch) => {
			const rotation = parseCSSValue(branch.rotation);
			const length = parseCSSValue(branch.length) * dpr;
			const width = parseCSSValue(branch.width) * dpr;
			const windIntensity = parseCSSValue(branch.windIntensity) * dpr;

			const radians = ((parentRotation + rotation) * Math.PI) / 180;
			const x = parentX;
			const y = parentY;
			const endX = x + Math.sin(radians) * length;
			const endY = y - Math.cos(radians) * length;

			const instance = {
				id: branch.id,
				x,
				y,
				endX,
				endY,
				width,
				length,
				rotation: parentRotation + rotation,
				absoluteRotation: radians,
				magicSeedRotationDegrees: branch.magicseed ? branch.rotation : 0, // NOUVEAU
				color: branch.color || 'tan',
				zIndex: branch.zIndex || 0,
				magicseed: branch.magicseed || false,
				windIntensity: windIntensity,
				windy: branch.windy || false,
				swayOnHover: branch.swayOnHover || false,
				growing: false,
				growthProgress: 0,
				growthOrder: depth,
				windPhase: Math.random() * Math.PI * 2,
				swayProgress: 0,
				depth
			};

			instances.push(instance);

			if (branch.childBranches && branch.childBranches.length > 0) {
				const childInstances = flattenBranches(
					branch.childBranches,
					endX,
					endY,
					instance.rotation,
					depth + 1
				);
				instances.push(...childInstances);
			}
		});

		return instances;
	}

	// ============================================
	// RENDERING
	// ============================================

	function resizeCanvas() {
		if (!canvas || !containerDiv) return;

		// Prendre en compte le devicePixelRatio pour les écrans haute densité
		const dpr = window.devicePixelRatio || 1;

		const width = window.innerWidth;
		const height = window.innerHeight;

		// Taille d'affichage CSS (normale)
		canvas.style.width = width + 'px';
		canvas.style.height = height + 'px';

		// Résolution interne du canvas (multipliée par dpr)
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
		if (!canvas || allTheBranches.length === 0) return;

		const dpr = window.devicePixelRatio || 1;

		const treeGroundPx = parseCSSValue(treeGround);
		const leftPercent = parseFloat(leftPosition) / 100;

		// Multiplier les positions par dpr pour correspondre à la résolution du canvas
		const startX = offsetLeft * dpr;
		const startY = (offsetTop + treeGroundPx) * dpr;

		branchInstances = flattenBranches(allTheBranches, startX, startY, 0, 0);
		maxGrowthOrder = Math.max(...branchInstances.map((b) => b.growthOrder));
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
			absoluteRotation,
			magicseed,
			magicSeedRotationDegrees
		} = instance;

		if (growing && growthProgress === 0) {
			return;
		}

		// Ne pas dessiner la magicseed si elle a été cliquée
		if (magicseed && clickedMagicSeed) {
			return;
		}

		// Pour la magicseed, dessiner un carré holographique avec gradient
		if (magicseed) {
			const dpr = window.devicePixelRatio || 1;
			const size = 50 * dpr;
			const halfSize = size / 2;

			// Décaler le centre de la magicseed pour que son coin supérieur gauche
			// soit à la position (x, y) qui est le bout de la branche parente

			// La rotation de la magicseed
			const rotationRadians = (magicSeedRotationDegrees * Math.PI) / 180;

			// Vecteur du coin supérieur gauche au centre (avant rotation)
			// Coin sup gauche = (-halfSize, -halfSize)
			// Donc pour centrer le coin sup gauche à (x,y), le centre doit être décalé de (+halfSize, +halfSize)

			// Appliquer la rotation à ce décalage
			const cos = Math.cos(rotationRadians);
			const sin = Math.sin(rotationRadians);

			const offsetX = halfSize * cos - halfSize * sin;
			const offsetY = halfSize * sin + halfSize * cos;

			const centerX = x + offsetX;
			const centerY = y + offsetY;

			// Les 4 coins du carré avant rotation
			const corners = [
				[-halfSize, -halfSize],
				[halfSize, -halfSize],
				[-halfSize, halfSize],
				[halfSize, halfSize]
			];

			// Appliquer la rotation aux coins
			const rotatedCorners = corners.map(([cx, cy]) => {
				return [centerX + cx * cos - cy * sin, centerY + cx * sin + cy * cos];
			});

			const positions = new Float32Array([
				rotatedCorners[0][0],
				rotatedCorners[0][1],
				rotatedCorners[1][0],
				rotatedCorners[1][1],
				rotatedCorners[2][0],
				rotatedCorners[2][1],

				rotatedCorners[2][0],
				rotatedCorners[2][1],
				rotatedCorners[1][0],
				rotatedCorners[1][1],
				rotatedCorners[3][0],
				rotatedCorners[3][1]
			]);

			gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
			gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

			// Utiliser le programme spécial pour la magicseed
			gl.useProgram(magicSeedProgram);

			gl.uniform2f(magicSeedResolutionLocation, canvas.width, canvas.height);
			gl.uniform1f(magicSeedTimeLocation, time);
			gl.uniform2f(magicSeedSeedPositionLocation, endX - halfSize, endY - halfSize);
			gl.uniform2f(magicSeedSeedSizeLocation, size, size);

			gl.vertexAttribPointer(magicSeedPositionAttrLocation, 2, gl.FLOAT, false, 0, 0);
			gl.enableVertexAttribArray(magicSeedPositionAttrLocation);

			gl.drawArrays(gl.TRIANGLES, 0, 6);

			// Revenir au programme normal
			gl.useProgram(program);

			return;
		}

		// Code existant pour les branches normales...
		const currentLength = growing ? growthProgress : 1;
		const currentEndY = y + (endY - y) * currentLength;
		const currentEndX = x + (endX - x) * currentLength;

		let windOffsetX = 0;

		if (windy && windIntensity > 0 && (!growing || growthProgress > 0)) {
			const windAmount = Math.sin(time * 0.002 + windPhase) * windIntensity;
			windOffsetX = windAmount * Math.sin(absoluteRotation);
		}

		const halfWidth = width / 2;

		const perpX = -Math.cos(absoluteRotation);
		const perpY = -Math.sin(absoluteRotation);

		const positions = new Float32Array([
			x + perpX * halfWidth,
			y + perpY * halfWidth,
			x - perpX * halfWidth,
			y - perpY * halfWidth,
			currentEndX + perpX * halfWidth + windOffsetX,
			currentEndY + perpY * halfWidth,

			currentEndX + perpX * halfWidth + windOffsetX,
			currentEndY + perpY * halfWidth,
			x - perpX * halfWidth,
			y - perpY * halfWidth,
			currentEndX - perpX * halfWidth + windOffsetX,
			currentEndY - perpY * halfWidth
		]);

		gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

		gl.uniform2f(resolutionLocation, canvas.width, canvas.height);

		const rgbaColor = colorToRgba(color);
		gl.uniform4fv(colorLocation, rgbaColor);

		gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(positionLocation);

		gl.drawArrays(gl.TRIANGLES, 0, 6);
	}

	function render(time) {
		if (!gl) return;

		gl.clearColor(0, 0, 0, 0);
		gl.clear(gl.COLOR_BUFFER_BIT);

		gl.enable(gl.BLEND);
		// Changer le blending pour éviter les artefacts sur les bords
		gl.blendFunc(gl.ONE, gl.GL_CONSTANT_COLOR); // Au lieu de gl.SRC_ALPHA

		gl.useProgram(program);

		const sorted = [...branchInstances].sort((a, b) => a.zIndex - b.zIndex);

		sorted.forEach((instance) => {
			if (instance.growing && instance.growthProgress < 1) {
				const timeSinceStart = time - growthStartTime;
				const delayPerLevel = 50;
				const growthDuration = 50;
				const startTime = instance.growthOrder * delayPerLevel;

				if (timeSinceStart >= startTime) {
					const localProgress = Math.min(1, (timeSinceStart - startTime) / growthDuration);
					instance.growthProgress = localProgress;
				} else {
					instance.growthProgress = 0;
				}
			}

			// Dessiner toutes les branches (magicseed incluse)
			drawBranch(instance, time);
		});

		animationFrameId = requestAnimationFrame(render);
	}

	// ============================================
	// INTERACTIONS
	// ============================================

	function handleCanvasClick(e) {
		const rect = canvas.getBoundingClientRect();
		const dpr = window.devicePixelRatio || 1;
		const clickX = (e.clientX - rect.left) * dpr;
		const clickY = (e.clientY - rect.top) * dpr;

		const magicSeed = branchInstances.find((b) => {
			if (!b.magicseed) return false;

			// Recalculer la position du centre de la magicseed
			const size = 50 * dpr;
			const halfSize = size / 2;
			const rotationRadians = (b.magicSeedRotationDegrees * Math.PI) / 180;
			const cos = Math.cos(rotationRadians);
			const sin = Math.sin(rotationRadians);
			const offsetX = halfSize * cos - halfSize * sin;
			const offsetY = halfSize * sin + halfSize * cos;
			const centerX = b.x + offsetX;
			const centerY = b.y + offsetY;

			const dx = Math.abs(centerX - clickX);
			const dy = Math.abs(centerY - clickY);
			return dx < 25 * dpr && dy < 25 * dpr;
		});

		if (magicSeed && !clickedMagicSeed) {
			clickedMagicSeed = magicSeed;

			// Calculer la position du centre de la magicseed dans l'espace de la page
			const size = 50 * dpr;
			const halfSize = size / 2;
			const rotationRadians = (magicSeed.magicSeedRotationDegrees * Math.PI) / 180;
			const cos = Math.cos(rotationRadians);
			const sin = Math.sin(rotationRadians);
			const offsetX = halfSize * cos - halfSize * sin;
			const offsetY = halfSize * sin + halfSize * cos;

			const centerX = magicSeed.x + offsetX;
			const centerY = magicSeed.y + offsetY;

			// Convertir en coordonnées de page
			const pageX = rect.left + centerX / dpr;
			const pageY = rect.top + centerY / dpr;

			magicSeedPositionWritable.set({
				top: pageY - 25, // -25 car la magicseed DOM fait 50px et on veut centrer
				left: pageX - 25,
				angle: magicSeed.magicSeedRotationDegrees
			});

			dispatch('branchMagicSeedWasClicked');
		}
	}

	// ============================================
	// REACTIVE STATEMENTS
	// ============================================

	$: if (isFirstBranchGrowing && branchInstances.length > 0) {
		growthStartTime = performance.now();
		branchInstances.forEach((instance) => {
			instance.growing = true;
			instance.growthProgress = 0;
		});
	}

	// Recalculer quand offsetLeft ou offsetTop change
	$: if (
		offsetLeft !== undefined &&
		offsetTop !== undefined &&
		allTheBranches.length > 0 &&
		canvas
	) {
		updateBranchPositions();
	}

	// ============================================
	// LIFECYCLE
	// ============================================

	let magicSeedProgram;
	let magicSeedTimeLocation;
	let magicSeedPositionAttrLocation;
	let magicSeedResolutionLocation;
	let magicSeedSeedPositionLocation;
	let magicSeedSeedSizeLocation;

	onMount(() => {
		gl = canvas.getContext('webgl', {
			alpha: true,
			premultipliedAlpha: false,
			antialias: false, // DÉSACTIVER L'ANTIALIASING
			depth: false,
			stencil: false
		});

		if (!gl) {
			console.error('WebGL non supporté');
			return;
		}

		const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
		const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
		program = createProgram(gl, vertexShader, fragmentShader);

		positionLocation = gl.getAttribLocation(program, 'a_position');
		resolutionLocation = gl.getUniformLocation(program, 'u_resolution');
		colorLocation = gl.getUniformLocation(program, 'u_color');

		// Programme pour la magicseed
		const magicSeedVertexShader = createShader(gl, gl.VERTEX_SHADER, magicSeedVertexShaderSource);
		const magicSeedFragmentShader = createShader(
			gl,
			gl.FRAGMENT_SHADER,
			magicSeedFragmentShaderSource
		);
		magicSeedProgram = createProgram(gl, magicSeedVertexShader, magicSeedFragmentShader);

		magicSeedPositionAttrLocation = gl.getAttribLocation(magicSeedProgram, 'a_position');
		magicSeedResolutionLocation = gl.getUniformLocation(magicSeedProgram, 'u_resolution');
		magicSeedTimeLocation = gl.getUniformLocation(magicSeedProgram, 'u_time');
		magicSeedSeedPositionLocation = gl.getUniformLocation(magicSeedProgram, 'u_seedPosition');
		magicSeedSeedSizeLocation = gl.getUniformLocation(magicSeedProgram, 'u_seedSize');

		positionBuffer = gl.createBuffer();

		gl.useProgram(program);

		// Attendre que le DOM soit rendu et que .central.expanded existe
		setTimeout(() => {
			resizeCanvas();
		}, 100);

		window.addEventListener('resize', resizeCanvas);

		canvas.addEventListener('click', handleCanvasClick);
		canvas.addEventListener('touchstart', handleCanvasClick, { passive: true });

		animationFrameId = requestAnimationFrame(render);
	});

	onDestroy(() => {
		if (animationFrameId) {
			cancelAnimationFrame(animationFrameId);
		}
		window.removeEventListener('resize', resizeCanvas);

		if (canvas) {
			canvas.removeEventListener('click', handleCanvasClick);
			canvas.removeEventListener('touchstart', handleCanvasClick);
		}

		if (gl) {
			gl.deleteProgram(program);
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
