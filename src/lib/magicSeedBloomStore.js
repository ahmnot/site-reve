// magicSeedBloomStore.js
import { writable } from 'svelte/store';

export const isMagicSeedBloomTriggered = writable(false);
export const magicSeedBloomLeftOffset = writable(0);
export const magicSeedBloomBottomOffset = writable(0);
export const magicSeedBloomRotation = writable(0); // NOUVEAU
