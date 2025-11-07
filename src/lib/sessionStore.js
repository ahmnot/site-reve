// sessionStore.js
import { writable } from 'svelte/store';
import { browser } from '$app/environment';

const SESSION_KEY = 'rainAndTreeSession';
const SESSION_DURATION = 30 * 60 * 1000; // 1/2 heure en millisecondes

function createSessionStore() {
    const { subscribe, set, update } = writable({
        isCloudAndRainHidden: false,
        isFirstBranchGrowing: false,
        timestamp: null
    });

    return {
        subscribe,
        
        // Sauvegarder l'état de la session
        saveSession: (isCloudAndRainHidden, isFirstBranchGrowing) => {
            if (!browser) return;
            
            const sessionData = {
                isCloudAndRainHidden,
                isFirstBranchGrowing,
                timestamp: Date.now()
            };
            
            sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
            set(sessionData);
        },
        
        // Charger l'état de la session
        loadSession: () => {
            if (!browser) return null;
            
            const stored = sessionStorage.getItem(SESSION_KEY);
            if (!stored) return null;
            
            try {
                const sessionData = JSON.parse(stored);
                const now = Date.now();
                const elapsed = now - sessionData.timestamp;
                
                // Vérifier si la session est encore valide (moins d'1 heure)
                if (elapsed < SESSION_DURATION) {
                    set(sessionData);
                    return sessionData;
                } else {
                    // Session expirée, la supprimer
                    sessionStorage.removeItem(SESSION_KEY);
                    return null;
                }
            } catch (e) {
                console.error('Erreur lors du chargement de la session:', e);
                return null;
            }
        },
        
        // Effacer la session
        clearSession: () => {
            if (!browser) return;
            
            sessionStorage.removeItem(SESSION_KEY);
            set({
                isCloudAndRainHidden: false,
                isFirstBranchGrowing: false,
                timestamp: null
            });
        }
    };
}

export const sessionStore = createSessionStore();