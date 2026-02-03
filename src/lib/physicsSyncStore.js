import { writable } from 'svelte/store';

export const physicsSyncStore = writable({
    active: false,
    x: 0,
    y: 0,
    angle: 0,
    grounded: false
});