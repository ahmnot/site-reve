// branchesStore.js
import { writable } from 'svelte/store';

// Variables d’état internes à la génération des branches
let magicSeedGenerated = false;
let trunkBranchPosition = 0;
export let magicSeedAngle = 0;

// Générateur d’ID unique
let idCounter = 0;
function generateUniqueId(prefix = '') {
    idCounter += 1;
    return `${prefix}-${idCounter}`;
}

// Retourne une valeur aléatoire parmi un tableau, avec un signe aléatoire
function getRandomValueWithSign(valuesToPickFrom) {
    const randomIndex = Math.floor(Math.random() * valuesToPickFrom.length);
    const randomValue = valuesToPickFrom[randomIndex];
    const randomSign = Math.random() < 0.5 ? -1 : 1;
    return randomValue * randomSign;
}

// Retourne une valeur aléatoire entre min et max
function getRandomValue(min, max) {
    return Math.random() * (max - min) + min;
}

/**
 * Génère récursivement la structure de l’arbre.
 *
 * @param {object} config - La configuration incluant notamment :
 *    - numberOfBranches, depth, baseId, branchAngleLimitation, initialBranchAngle,
 *      initialBranchWidth, initialBranchLength, angleDecrementFactor, widthDecrementFactor,
 *      lengthDecrementFactor, leafProbability, spiralProbability,
 *      initialBranchOnBranchProbability, branchOnBranchProbabilityDecrementFactor,
 *      subBranchesFixedParameters (optionnel),
 *    - initialDepth : la profondeur initiale (par exemple 2),
 *    - magicSeedBranchPosition : la position de la branche dédiée à la MagicSeed,
 *    - oldMagicSeedWasClicked : booléen indiquant si la MagicSeed a déjà été cliquée
 *
 * @returns {Array} Tableau représentant les branches générées.
 */
export function generateBranches(config) {
    const {
        numberOfBranches,
        depth,
        baseId,
        branchAngleLimitation,
        initialBranchAngle,
        initialBranchWidth,
        initialBranchLength,
        angleDecrementFactor,
        widthDecrementFactor,
        lengthDecrementFactor,
        leafProbability,
        spiralProbability,
        initialBranchOnBranchProbability,
        branchOnBranchProbabilityDecrementFactor,
        subBranchesFixedParameters = {},
        initialDepth,
        magicSeedBranchPosition,
        oldMagicSeedWasClicked,
        isWindy
    } = config;

    const finalBranches = [];
    let rotationToAdd = initialBranchAngle;
    let currentWidth = initialBranchWidth;
    let currentLength = initialBranchLength;
    let currentBranchOnBranchProbability = initialBranchOnBranchProbability;
    let inSpiralMode = false;
    let absoluteAngle = 0;
    let spirallingCount = 0;

    // On génère la magicSeed uniquement si on est sur la dernière profondeur ET que la seed n’a pas déjà été générée ni cliquée
    let magicSeedCondition =
        depth === initialDepth - 1 &&
        !magicSeedGenerated &&
        trunkBranchPosition > magicSeedBranchPosition &&
        !oldMagicSeedWasClicked;

    let parentBranch = {
        id: generateUniqueId(baseId),
        zIndex: magicSeedCondition ? 999 : 0,
        width: `${currentWidth}px`,
        length: magicSeedCondition ? '4vw' : `${currentLength}px`,
        rotation: magicSeedCondition ? '90deg' : `${rotationToAdd}deg`,
        color: 'tan',
        windIntensity: `0px`,
        swayOnHover: true,
        childBranches: []
    };

    finalBranches.push(parentBranch);

    let childBranch;

    for (let i = 0; i < numberOfBranches; i++) {
        if (depth === initialDepth) {
            trunkBranchPosition = i;
        }

        currentWidth *= widthDecrementFactor;
        currentLength *= lengthDecrementFactor;
        currentBranchOnBranchProbability *= branchOnBranchProbabilityDecrementFactor;

        rotationToAdd = getRandomValueWithSign([2.8125, 5.625, 11.25]);

        // Contrôle de la direction générale
        if (Math.abs(absoluteAngle + rotationToAdd) > branchAngleLimitation) {
            rotationToAdd = 0;
        }

        if (!inSpiralMode && Math.random() < spiralProbability && i < numberOfBranches - 4) {
            inSpiralMode = true;
            spirallingCount = 0;
        }

        if (inSpiralMode) {
            rotationToAdd = 90;
            spirallingCount++;
            if (spirallingCount >= 4) {
                inSpiralMode = false;
            }
        } else {
            rotationToAdd *= angleDecrementFactor;
        }

        absoluteAngle = (absoluteAngle + rotationToAdd) % 360;

        childBranch = {
            id: generateUniqueId(baseId),
            zIndex: 5,
            width: `${currentWidth}px`,
            length: `${currentLength}px`,
            rotation: `${rotationToAdd}deg`,
            color: 'tan',
            windIntensity: `3px`,
            windy: isWindy ? i % 3 === 0 : 0 ,
            childBranches: []
        };

        // Génération de la MagicSeed sur la dernière branche du trunk
        if (magicSeedCondition && i === numberOfBranches - 1) {
            childBranch.childBranches.push({
                id: generateUniqueId(`${childBranch.id}-seed`),
                zIndex: 999,
                width: '50px',
                length: '50px',
                rotation: absoluteAngle,
                magicseed: true
            });
            magicSeedGenerated = true;
            magicSeedAngle = absoluteAngle;
        }

        // Ajout de feuilles sur la branche de la MagicSeed (pour éviter les chevauchements)
        if (magicSeedCondition && i < 7) {
            childBranch.childBranches.push({
                id: generateUniqueId(`${childBranch.id}-leaf`),
                zIndex: 50,
                width: `${getRandomValue(8, 10)}px`,
                length: `${getRandomValue(14, 15)}px`,
                rotation: `${Math.random() < 0.5 ? 90 : -90}deg`,
                color: 'forestgreen',
                windIntensity: `${1 / (widthDecrementFactor * 0.95)}px`,
                childBranches: []
            });
        }

        parentBranch.childBranches.push(childBranch);

        // Ajout de feuilles sur les branches classiques
        if (!magicSeedCondition && Math.random() < leafProbability) {
            childBranch.childBranches.push({
                id: generateUniqueId(`${childBranch.id}-leaf`),
                zIndex: 100,
                width: `${getRandomValue(8, 10)}px`,
                length: `${getRandomValue(12, 15)}px`,
                rotation: `${Math.random() < 0.5 ? 90 : -90}deg`,
                color: 'forestgreen',
                windIntensity: `${2 / (widthDecrementFactor * 0.95)}px`,
                windy:  isWindy ? i % 9 === 0 : 0,
                childBranches: []
            });
        }

        const newSetOfBranchesAngle =
            -absoluteAngle + getRandomValueWithSign([10, 20, 45].map(a => a * angleDecrementFactor));

        if (depth > 0 && Math.random() < currentBranchOnBranchProbability) {
            childBranch.childBranches.push(
                ...generateBranches({
                    numberOfBranches: Math.floor(numberOfBranches / 1.5),
                    depth: depth - 1,
                    baseId: `${baseId}-${i}`,
                    initialBranchAngle: newSetOfBranchesAngle,
                    ...subBranchesFixedParameters,
                    initialDepth,
                    magicSeedBranchPosition,
                    oldMagicSeedWasClicked
                })
            );
        }

        parentBranch = childBranch;

        // if (i === numberOfBranches - 1 && !magicSeedCondition) {
        //     childBranch.childBranches.push({
        //         id: generateUniqueId(`${childBranch.id}-leaf`),
        //         zIndex: 100,
        //         width: '10px',
        //         length: '12px',
        //         rotation: `-90deg`,
        //         color: Math.random() < 0.5 ? 'thistle' : 'mistyrose',
        //         windIntensity: '10px',
        //         childBranches: []
        //     });
        // }
    }

    return finalBranches;
}

/**
 * Réinitialise les variables internes afin de pouvoir régénérer l’arbre (exemple : sur redimensionnement).
 */
export function resetBranchGeneration() {
    magicSeedGenerated = false;
    trunkBranchPosition = 0;
}
