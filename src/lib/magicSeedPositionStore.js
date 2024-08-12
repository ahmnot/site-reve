// positionStore.js
import { writable } from 'svelte/store';

export const magicSeedPositionWritable = writable({ top: 0, left: 0, angle: 0 });