<script>
    //TextInput.svelte
    import { createEventDispatcher } from 'svelte';

    const dispatch = createEventDispatcher();
    let inputValue = '';
    let inputElement; // Référence vers l'élément input

    function handleKeydown(event) {
        if (event.key === 'Enter') {
            const trimmed = inputValue.trim();
            if (trimmed.length > 0) {
                dispatch('submit', { value: trimmed });
                // Optionnel : vider le champ
                // inputValue = '';
            }
        }
    }

    // Forcer le focus sur mobile
    function handleTouchEnd(event) {
        event.preventDefault();
        event.stopPropagation();
        if (event.target === inputElement) {
            inputElement.focus();
            // Sur iOS, on peut avoir besoin d'un petit délai
            setTimeout(() => {
                inputElement.focus();
            }, 100);
        }
    }
</script>

<style>
    .text-input-wrapper {
        position: absolute; /* Changé de fixed à absolute */
        top: 20px; 
        left: 20px;
        background-color: #f1feff83;
        border: 1px solid #d3b58c73;
        z-index: 9999;
        touch-action: none; /* Empêche les gestes par défaut du navigateur */
    }

    input {
        width: 140px;
        height: 30px;
        font-size: 1rem;
        font-family: 'Minecraft', sans-serif;
        border: none;
        outline: none;
        background: transparent;
        touch-action: none; /* Empêche les gestes par défaut du navigateur */
    }
</style>

<div 
    class="text-input-wrapper"
    on:touchend={handleTouchEnd}
>
    <input
        type="text"
        bind:value={inputValue}
        bind:this={inputElement}
        on:keydown={handleKeydown}
        on:touchend={handleTouchEnd}
    />
</div>

