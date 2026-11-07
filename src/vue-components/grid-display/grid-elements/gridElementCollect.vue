<template>
    <div class="grid-item-content faixa-frase" :class="{'faixa-vazia': vazia}">
        <div ref="saida" :class="`collect-outer-container text-container ${metadata.textConfig.fontFamily}`"
             :data-vazio="$t('pranchaFraseVazia')"
             style="position: absolute; display: flex; top: 5px; right: 5px; bottom: 5px; left: 5px;">
        </div>
    </div>
</template>

<script>
/**
 * Phrase bar (Grilo Falante). The content (chosen pictures and words) is written by collectElementService;
 * this component only gives it the new look: every word in a "pill", a short pop-in animation for the
 * newest word (none with "reduce motion") and a hint while the bar is empty.
 * Size and position come from the board, as the family made it.
 */
export default {
    props: ["metadata", "containerSize"],
    data() {
        return {
            vazia: true,
            observador: null
        };
    },
    methods: {
        conferir() {
            let saida = this.$refs.saida;
            this.vazia = !saida || (!saida.textContent.trim() && !saida.querySelector('img'));
        }
    },
    mounted() {
        this.conferir();
        if (window.MutationObserver && this.$refs.saida) {
            this.observador = new MutationObserver(() => this.conferir());
            this.observador.observe(this.$refs.saida, { childList: true, subtree: true, characterData: true });
        }
    },
    beforeDestroy() {
        if (this.observador) {
            this.observador.disconnect();
        }
    }
}
</script>

<style>
/* not scoped: the HTML inside comes from collectElementService */
.faixa-frase .collect-outer-container {
    font-family: var(--g-fonte);
}

/* light bar (the default grey of the original becomes white, dark mode stays as it is) */
.faixa-frase .collect-container[style*="#E8E8E8"] {
    background-color: var(--g-superficie) !important;
    color: var(--g-tinta);
}
.faixa-frase .collect-container {
    border-radius: var(--g-raio);
    box-shadow: inset 0 0 0 2px var(--g-borda);
    padding: 2px 4px;
    scrollbar-width: thin;
}

/* each chosen picture / word is a pill */
.faixa-frase .collect-items-container {
    align-items: center;
    gap: 4px;
}
.faixa-frase .collect-items-container > div {
    border-radius: 14px;
    background-color: var(--g-superficie-2);
    color: var(--g-tinta) !important;
    box-shadow: inset 0 0 0 1px var(--g-borda);
}
.faixa-frase .collect-items-container > div img {
    border-radius: 10px;
}
/* the word that is being spoken right now */
.faixa-frase .collect-items-container > div[style*="lightgreen"] {
    background-color: var(--g-girassol) !important;
    box-shadow: inset 0 0 0 2px #e0b100;
}
.faixa-frase .collect-items-container > div[style*="darkgreen"] {
    box-shadow: inset 0 0 0 2px var(--g-girassol);
}
.faixa-frase .collect-items-container > div:last-child {
    animation: faixa-entrar var(--g-medio) var(--g-curva);
}
@keyframes faixa-entrar {
    from { transform: scale(0.6); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
}

/* hint while nothing was chosen yet */
.faixa-frase.faixa-vazia .collect-outer-container::before {
    content: attr(data-vazio);
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    padding: 0 var(--g-e4);
    color: var(--g-tinta-3);
    font-family: var(--g-fonte);
    font-size: clamp(12.8px, 2.2vh, 18.4px);
    font-weight: 400;
    pointer-events: none;
    z-index: 1;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
}

@media (prefers-reduced-motion: reduce) {
    .faixa-frase .collect-items-container > div:last-child { animation: none; }
}
</style>
