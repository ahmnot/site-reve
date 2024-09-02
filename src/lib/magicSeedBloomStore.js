// src/stores/rainStore.js
import { writable } from 'svelte/store';

export const isMagicSeedBloomTriggered = writable(false);
export const magicSeedBloomLeftOffset = writable(0);
