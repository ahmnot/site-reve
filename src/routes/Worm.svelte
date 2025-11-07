<script>
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import { showLevel2 } from '../lib/levelStore.js';

	/** Nombre de segments du ver */
	export let numberRectangles = 20;
	/** Longueur de chaque segment (px) */
	export let segmentLength = 30;
	/** Largeur de chaque segment (px) */
	export let segmentWidth = 10;
	/** Vitesse de déplacement (px / frame) */
	export let speed = 2;
	/** Vitesse de déplacement en mode manuel (px / frame) */
	export let manualSpeed = 0.7;
	/** Taux de transition de vitesse (0-1, plus élevé = transition plus rapide) */
	export let speedTransitionRate = 0.05;
	/** Zigzag aléatoire normal (rad / frame max) */
	export let maxTurnAngle = 0.5;
	/** Distance (px) de détection du mur avant collision */
	export let detectionDistance = 60;
	/** Amplitude max (rad) pour viser l'évitement */
	export let maxAvoidAngle = 0.5;
	/** Vitesse de rotation lors d'un évitement ou attraction (rad / frame max) */
	export let avoidTurnRate = 0.1;
	/** Vitesse de rotation lors du contrôle manuel (rad / frame max) - plus faible pour l'inertie */
	export let manualTurnRate = 0.03;
	/** Angle d'hésitation (rad) lors du contrôle manuel */
	export let manualHesitationAngle = 0.3;
	/** Probabilité par frame d'apparition d'une pépite (entre 0 et 1) */
	export let nuggetRarity = 0.0007;
	/** Taille des pépites (px) */
	export let nuggetSize = 10;
	/** Angle d'hésitation (rad) lors de l'attraction vers une pépite */
	export let hesitationAngle = 1.5;
	/** Durée de vie d'une pépite non collectée (ms) */
	export let nuggetLifetime = 6000;
	/** Durée de vie de la première pépite (ms) */
	export let firstNuggetLifetime = 12000;
	/** Délai (ms) avant reprise automatique après relâchement des touches */
	export let autoResumeDelay = 1000;

	let segments = [];
	let nuggets = [];
	let nextNuggetId = 0;
	let vw, vh;
	let rafId;
	let firstNuggetCreated = false;

	// Contrôle manuel avec tracking des touches pressées
	let pressedKeys = new Set();
	let isManualControl = false;
	let autoResumeTimeout = null;

	// Vitesse actuelle avec interpolation
	let currentSpeed = speed;

	// Initialise le ver centré et réinitialise les pépites
	function initSegments() {
		vw = window.innerWidth;
		vh = window.innerHeight;
		const margin = 100; // décalage depuis le coin
		// Démarrage en bas à droite
		const startX = vw - segmentLength / 2 - margin;
		const startY = vh - segmentWidth / 2 - margin;
		segments = [];
		// Position initiale alignée vers la gauche
		for (let i = 0; i < numberRectangles; i++) {
			segments.push({ x: startX - i * segmentLength, y: startY, angle: Math.PI });
		}
		nuggets = [];
		nextNuggetId = 0;
	}

	// Crée la première pépite
	function createFirstNugget() {
		if (firstNuggetCreated || !vw || !vh) return;
		
		const minX = segmentLength / 2;
		const maxX = vw - segmentLength / 2;
		const minY = segmentWidth / 2;
		const maxY = vh - segmentWidth / 2;
		
		nuggets.push({
			id: nextNuggetId++,
			x: randBetween(minX, maxX),
			y: randBetween(minY, maxY),
			createdAt: Date.now(),
			isFirst: true
		});
		nuggets = nuggets;
		firstNuggetCreated = true;
	}

	// Réagir quand showLevel2 devient true
	$: if ($showLevel2 && !firstNuggetCreated) {
		createFirstNugget();
	}

	// Calcule l'angle désiré en fonction des touches pressées
	function getManualAngle() {
		let dx = 0;
		let dy = 0;

		if (pressedKeys.has('ArrowUp')) dy -= 1;
		if (pressedKeys.has('ArrowDown')) dy += 1;
		if (pressedKeys.has('ArrowLeft')) dx -= 1;
		if (pressedKeys.has('ArrowRight')) dx += 1;

		// Si aucune touche ou touches opposées annulées
		if (dx === 0 && dy === 0) return null;

		// Calcul de l'angle en fonction du vecteur directionnel
		return Math.atan2(dy, dx);
	}

	// Gestion du clavier
	function handleKeyDown(event) {
		const key = event.key;

		if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
			event.preventDefault();
			pressedKeys.add(key);
			isManualControl = true;
			
			// Annuler le timeout de reprise automatique
			if (autoResumeTimeout) {
				clearTimeout(autoResumeTimeout);
				autoResumeTimeout = null;
			}
		}
	}

	function handleKeyUp(event) {
		const key = event.key;
		
		if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
			pressedKeys.delete(key);
			
			// Si plus aucune touche directionnelle n'est pressée
			if (pressedKeys.size === 0) {
				// Démarrer le compte à rebours pour reprise automatique
				if (autoResumeTimeout) {
					clearTimeout(autoResumeTimeout);
				}
				autoResumeTimeout = setTimeout(() => {
					isManualControl = false;
				}, autoResumeDelay);
			}
		}
	}

	// Renvoie un nombre aléatoire entre min et max
	function randBetween(min, max) {
		return min + Math.random() * (max - min);
	}

	// Normalise un angle dans [-PI, PI]
	function normalizeAngle(a) {
		return ((a + Math.PI) % (2 * Math.PI)) - Math.PI;
	}

	// Interpole progressivement vers la vitesse cible
	function interpolateSpeed(current, target, rate) {
		const diff = target - current;
		if (Math.abs(diff) < 0.01) return target; // Éviter les micro-ajustements
		return current + diff * rate;
	}

	function animate() {
		const head = segments[0];
		const now = Date.now();
		const minX = segmentLength / 2;
		const maxX = vw - segmentLength / 2;
		const minY = segmentWidth / 2;
		const maxY = vh - segmentWidth / 2;

		// 1️⃣ Suppression des pépites expirées
		for (let i = nuggets.length - 1; i >= 0; i--) {
			const lifetime = nuggets[i].isFirst ? firstNuggetLifetime : nuggetLifetime;
			if (now - nuggets[i].createdAt > lifetime) {
				nuggets.splice(i, 1);
			}
		}

		// 2️⃣ Spawn de nouvelles pépites
		if (Math.random() < nuggetRarity) {
			nuggets.push({
				id: nextNuggetId++,
				x: randBetween(minX, maxX),
				y: randBetween(minY, maxY),
				createdAt: now,
				isFirst: false
			});
		}

		// 3️⃣ Calcul futur pour détection mur
		const futureX = head.x + Math.cos(head.angle) * detectionDistance;
		const futureY = head.y + Math.sin(head.angle) * detectionDistance;

		let desiredAngle;
		let isAvoiding = false;
		let isAttracting = false;
		let turnRate = maxTurnAngle;
		let targetSpeed = speed; // Vitesse cible par défaut

		// MODE MANUEL : Utiliser la direction du clavier
		if (isManualControl) {
			const manualAngle = getManualAngle();
			if (manualAngle !== null) {
				// Ajouter l'effet d'hésitation
				desiredAngle = manualAngle + randBetween(-manualHesitationAngle, manualHesitationAngle);
				turnRate = manualTurnRate; // Rotation plus lente pour l'inertie
				targetSpeed = manualSpeed; // Vitesse cible en mode manuel
			} else {
				// Si touches opposées annulées, continuer dans la direction actuelle
				desiredAngle = head.angle;
				targetSpeed = manualSpeed;
			}
		}
		// MODE AUTOMATIQUE
		else {
			// 4️⃣ Attraction vers une pépite proche, avec hésitation
			if (nuggets.length > 0) {
				let nearest = nuggets[0];
				let bestDist = (head.x - nearest.x) ** 2 + (head.y - nearest.y) ** 2;
				for (const nug of nuggets) {
					const d2 = (head.x - nug.x) ** 2 + (head.y - nug.y) ** 2;
					if (d2 < bestDist) {
						bestDist = d2;
						nearest = nug;
					}
				}
				const targetAngle = Math.atan2(nearest.y - head.y, nearest.x - head.x);
				desiredAngle = targetAngle + randBetween(-hesitationAngle, hesitationAngle);
				isAttracting = true;
				turnRate = avoidTurnRate;
			} else {
				// 5️⃣ Détection d'un mur et évitement anticipé
				if (futureX < minX) {
					desiredAngle = randBetween(-maxAvoidAngle, +maxAvoidAngle);
					isAvoiding = true;
					turnRate = avoidTurnRate;
				} else if (futureX > maxX) {
					desiredAngle = Math.PI + randBetween(-maxAvoidAngle, +maxAvoidAngle);
					isAvoiding = true;
					turnRate = avoidTurnRate;
				} else if (futureY < minY) {
					desiredAngle = Math.PI / 2 + randBetween(-maxAvoidAngle, +maxAvoidAngle);
					isAvoiding = true;
					turnRate = avoidTurnRate;
				} else if (futureY > maxY) {
					desiredAngle = -Math.PI / 2 + randBetween(-maxAvoidAngle, +maxAvoidAngle);
					isAvoiding = true;
					turnRate = avoidTurnRate;
				} else {
					// 6️⃣ Zigzag normal
					desiredAngle = head.angle + randBetween(-maxTurnAngle, +maxTurnAngle);
				}
			}
			targetSpeed = speed; // Vitesse cible en mode automatique
		}

		// 7️⃣ Interpolation progressive de la vitesse
		currentSpeed = interpolateSpeed(currentSpeed, targetSpeed, speedTransitionRate);

		// 8️⃣ Rotation progressive vers desiredAngle avec inertie
		let delta = normalizeAngle(desiredAngle - head.angle);
		head.angle += Math.sign(delta) * Math.min(Math.abs(delta), turnRate);

		// 9️⃣ Déplacement de la tête avec la vitesse interpolée
		head.x += Math.cos(head.angle) * currentSpeed;
		head.y += Math.sin(head.angle) * currentSpeed;
		head.x = Math.min(maxX, Math.max(minX, head.x));
		head.y = Math.min(maxY, Math.max(minY, head.y));

		// 🔟 Collecte de pépites : contact bord à bord
		for (let i = nuggets.length - 1; i >= 0; i--) {
			const n = nuggets[i];
			const dx = Math.abs(head.x - n.x);
			const dy = Math.abs(head.y - n.y);
			const collisionX = dx <= segmentLength / 2 + nuggetSize / 2;
			const collisionY = dy <= segmentWidth / 2 + nuggetSize / 2;
			if (collisionX && collisionY) {
				const last = segments[segments.length - 1];
				segments.push({ x: last.x, y: last.y, angle: last.angle });
				nuggets.splice(i, 1);
			}
		}

		// 1️⃣1️⃣ Mise à jour des autres segments
		for (let i = 1; i < segments.length; i++) {
			const prev = segments[i - 1];
			const seg = segments[i];
			const dx = prev.x - seg.x;
			const dy = prev.y - seg.y;
			const ang = Math.atan2(dy, dx);
			seg.angle = ang;
			seg.x = prev.x - Math.cos(ang) * segmentLength;
			seg.y = prev.y - Math.sin(ang) * segmentLength;
		}

		// 1️⃣2️⃣ Déclencher la réactivité
		segments = segments;
		nuggets = nuggets;

		rafId = requestAnimationFrame(animate);
	}

	onMount(() => {
		initSegments();
		window.addEventListener('resize', initSegments);
		window.addEventListener('keydown', handleKeyDown);
		window.addEventListener('keyup', handleKeyUp);
		animate();
		return () => {
			window.removeEventListener('resize', initSegments);
			window.removeEventListener('keydown', handleKeyDown);
			window.removeEventListener('keyup', handleKeyUp);
			cancelAnimationFrame(rafId);
			if (autoResumeTimeout) {
				clearTimeout(autoResumeTimeout);
			}
		};
	});
</script>

<svg
	width="100%"
	height="100%"
	style="position:absolute; top:0; left:0; pointer-events:none; z-index:5;"
>
	<defs>
		<radialGradient id="haloGrad" cx="50%" cy="50%" r="50%">
			<stop offset="0%" stop-color="white" stop-opacity="0.6" />
			<stop offset="100%" stop-color="white" stop-opacity="0" />
		</radialGradient>
	</defs>

	{#each nuggets as n (n.id)}
		<rect
			x={n.x - nuggetSize / 2}
			y={n.y - nuggetSize / 2}
			width={nuggetSize}
			height={nuggetSize}
			fill="#d4af37"
			in:fade={{ duration: 400 }}
			out:fade={{ duration: 400 }}
		/>
	{/each}

	{#each segments as seg, i}
		<rect
			x={seg.x - segmentLength / 2}
			y={seg.y - segmentWidth / 2}
			width={segmentLength}
			height={segmentWidth}
			fill="plum"
			transform={`rotate(${(seg.angle * 180) / Math.PI}, ${seg.x}, ${seg.y})`}
		/>
	{/each}
</svg>

<style>
	svg defs {
		position: absolute;
	}
	@keyframes pulse {
		0% {
			r: 0;
			opacity: 0.6;
		}
		50% {
			r: 1;
			opacity: 0;
		}
		100% {
			r: 0;
			opacity: 0.6;
		}
	}
</style>