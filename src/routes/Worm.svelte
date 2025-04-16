<script>
	import { onMount } from 'svelte';

	/** Nombre de segments du ver */
	export let numberRectangles = 20;
	/** Longueur de chaque segment (px) */
	export let segmentLength = 30;
	/** Largeur de chaque segment (px) */
	export let segmentWidth = 10;
	/** Vitesse de déplacement (px / frame) */
	export let speed = 2;
	/** Zigzag aléatoire normal (rad / frame max) */
	export let maxTurnAngle = 0.5;
	/** Distance (px) de détection du mur avant collision */
	export let detectionDistance = 60;
	/** Amplitude max (rad) pour viser l’évitement */
	export let maxAvoidAngle = 0.5;
	/** Vitesse de rotation lors d’un évitement ou attraction (rad / frame max) */
	export let avoidTurnRate = 0.1;
	/** Probabilité par frame d’apparition d’une pépite (entre 0 et 1) */
	export let nuggetRarity = 0.0005;
	/** Taille des pépites (px) */
	export let nuggetSize = 10;
	/** Angle d'hésitation (rad) lors de l'attraction vers une pépite */
	export let hesitationAngle = 1;
	/** Durée de vie d'une pépite non collectée (ms) */
	export let nuggetLifetime = 5000;

	let segments = [];
	let nuggets = [];
	let nextNuggetId = 0;
	let vw, vh;
	let rafId;

	// Initialise le ver centré et réinitialise les pépites
	function initSegments() {
		vw = window.innerWidth;
		vh = window.innerHeight;
		const startX = vw / 2;
		const startY = vh / 2;
		segments = [];
		for (let i = 0; i < numberRectangles; i++) {
			segments.push({ x: startX - i * segmentLength, y: startY, angle: 0 });
		}
		nuggets = [];
		nextNuggetId = 0;
	}

	// Renvoie un nombre aléatoire entre min et max
	function randBetween(min, max) {
		return min + Math.random() * (max - min);
	}

	// Normalise un angle dans [-PI, PI]
	function normalizeAngle(a) {
		return ((a + Math.PI) % (2 * Math.PI)) - Math.PI;
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
			if (now - nuggets[i].createdAt > nuggetLifetime) {
				nuggets.splice(i, 1);
			}
		}

		// 2️⃣ Spawn de nouvelles pépites
		if (Math.random() < nuggetRarity) {
			nuggets.push({
				id: nextNuggetId++,
				x: randBetween(minX, maxX),
				y: randBetween(minY, maxY),
				createdAt: now
			});
		}

		// 3️⃣ Calcul futur pour détection mur
		const futureX = head.x + Math.cos(head.angle) * detectionDistance;
		const futureY = head.y + Math.sin(head.angle) * detectionDistance;

		let desiredAngle;
		let isAvoiding = false;
		let isAttracting = false;

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
		} else {
			// 5️⃣ Détection d’un mur et évitement anticipé
			if (futureX < minX) {
				desiredAngle = randBetween(-maxAvoidAngle, +maxAvoidAngle);
				isAvoiding = true;
			} else if (futureX > maxX) {
				desiredAngle = Math.PI + randBetween(-maxAvoidAngle, +maxAvoidAngle);
				isAvoiding = true;
			} else if (futureY < minY) {
				desiredAngle = Math.PI / 2 + randBetween(-maxAvoidAngle, +maxAvoidAngle);
				isAvoiding = true;
			} else if (futureY > maxY) {
				desiredAngle = -Math.PI / 2 + randBetween(-maxAvoidAngle, +maxAvoidAngle);
				isAvoiding = true;
			} else {
				// Zigzag normal
				desiredAngle = head.angle + randBetween(-maxTurnAngle, +maxTurnAngle);
			}
		}

		// 6️⃣ Rotation progressive vers desiredAngle
		let delta = normalizeAngle(desiredAngle - head.angle);
		const rate = isAvoiding || isAttracting ? avoidTurnRate : maxTurnAngle;
		head.angle += Math.sign(delta) * Math.min(Math.abs(delta), rate);

		// 7️⃣ Déplacement de la tête
		head.x += Math.cos(head.angle) * speed;
		head.y += Math.sin(head.angle) * speed;
		head.x = Math.min(maxX, Math.max(minX, head.x));
		head.y = Math.min(maxY, Math.max(minY, head.y));

		// 8️⃣ Collecte de pépites : contact bord à bord
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

		// 9️⃣ Mise à jour des autres segments
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

		// 10️⃣ Déclencher la réactivité
		segments = segments;
		nuggets = nuggets;

		rafId = requestAnimationFrame(animate);
	}

	onMount(() => {
		initSegments();
		window.addEventListener('resize', initSegments);
		animate();
		return () => {
			window.removeEventListener('resize', initSegments);
			cancelAnimationFrame(rafId);
		};
	});
</script>

<svg
	width="100%"
	height="100%"
	style="position:absolute; top:0; left:0; pointer-events:none; z-index:5;"
>
	{#each nuggets as n (n.id)}
		<rect
			x={n.x - nuggetSize / 2}
			y={n.y - nuggetSize / 2}
			width={nuggetSize}
			height={nuggetSize}
			fill="#d4af37"
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
