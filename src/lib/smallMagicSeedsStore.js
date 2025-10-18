// src/lib/smallMagicSeedsStore.js
import { writable } from 'svelte/store';

// Store pour chaque petite graine (index 0, 1, 2)
// Chaque entrée stocke la position de l'oldSmallSeed quand elle est cliquée
export const smallSeed0Position = writable({ top: 0, left: 0, angle: 0, clicked: false });
export const smallSeed1Position = writable({ top: 0, left: 0, angle: 0, clicked: false });
export const smallSeed2Position = writable({ top: 0, left: 0, angle: 0, clicked: false });

// Helper pour récupérer le bon store selon l'index
export function getSmallSeedStore(index) {
    switch(index) {
        case 0: return smallSeed0Position;
        case 1: return smallSeed1Position;
        case 2: return smallSeed2Position;
        default: return smallSeed0Position;
    }
}