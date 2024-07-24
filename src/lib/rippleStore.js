// src/lib/rippleStore.js
import { writable } from 'svelte/store';

export const ripples = writable([]);
let rippleTarget;

export function createRipple(x, y, isFirst) {
    if (!rippleTarget) return;
    const container = rippleTarget;
    const rect = container.getBoundingClientRect();
    const size = isFirst
        ? Math.max(rect.width, rect.height)
        : Math.max(rect.width, rect.height) / 2;
    const rippleX = x - rect.left - size / 2;
    const rippleY = y - rect.top - size / 2;

    const ripple = {
        id: `${Date.now()}-${Math.random()}`, // Ensure a unique ID
        x: rippleX,
        y: rippleY,
        size
    };

    ripples.update((r) => [...r, ripple]);
    setTimeout(() => {
        ripples.update((r) => r.filter((r) => r.id !== ripple.id));
    }, 1000);
}

export function startRipples(event) {
    rippleTarget = event.currentTarget;
    updateMousePosition(event);
    createRipple(mouseX, mouseY, true);
    isFirstRipple = false;
    lastRippleTime = Date.now(); // Reset the last ripple time to now
}

export function stopRipples() {
    rippleTarget = null;
    isFirstRipple = true;
}

export function updateMousePosition(event) {
    mouseX = event.clientX;
    mouseY = event.clientY;

    const currentTime = Date.now();
    if (
        rippleTarget &&
        (mouseX !== lastMouseX || mouseY !== lastMouseY) &&
        currentTime - lastRippleTime >= rippleDelay
    ) {
        createRipple(mouseX, mouseY, false);
        lastMouseX = mouseX;
        lastMouseY = mouseY;
        lastRippleTime = currentTime; // Update last ripple time
    }
}

let mouseX = 0;
let mouseY = 0;
let isFirstRipple = true;
let lastMouseX = 0;
let lastMouseY = 0;
let lastRippleTime = 0;
const rippleDelay = 40; // Delay in milliseconds between ripples
