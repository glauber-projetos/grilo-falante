<template>
    <div class="grid-item-content controle" :class="{'controle-destaque': visual.destaque, 'controle-pequeno': pequeno, 'controle-deitado': deitado}">
        <i :class="'ti ti-' + visual.icone" :style="iconeStyle" aria-hidden="true"></i>
        <span v-if="!pequeno" class="controle-texto" :style="textoStyle">{{ $t(visual.texto) }}</span>
    </div>
</template>

<script>
/**
 * Phrase bar control drawn in the new style (Grilo Falante): Tabler icon and a short word,
 * e.g. "Falar" in coral. See faixaFrase.js for which buttons are drawn like this.
 */
export default {
    props: ['visual', 'containerSize'],
    computed: {
        largura() {
            return this.containerSize ? this.containerSize.width : 80;
        },
        altura() {
            return this.containerSize ? this.containerSize.height : 80;
        },
        pequeno() {
            return this.largura < 56 || this.altura < 44;
        },
        deitado() {
            return !this.pequeno && this.largura >= this.altura * 1.8;
        },
        iconeStyle() {
            let base = this.deitado ? this.altura * 0.5 : Math.min(this.largura, this.altura) * (this.pequeno ? 0.6 : 0.42);
            return { fontSize: Math.max(16, Math.round(base)) + 'px' };
        },
        textoStyle() {
            let base = this.deitado ? this.altura * 0.32 : Math.min(this.largura * 0.2, this.altura * 0.2);
            return { fontSize: Math.max(12, Math.min(28, Math.round(base))) + 'px' };
        }
    }
};
</script>

<style scoped>
.controle {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    padding: 4px;
    color: var(--g-tinta);
    background: var(--g-superficie);
    font-family: var(--g-fonte);
    font-weight: 700;
    line-height: 1.1;
    text-align: center;
}
.controle .ti { line-height: 1; color: var(--g-folha-escura); }
.controle-deitado { flex-direction: row; gap: 0.4em; }
.controle-texto { max-width: 100%; overflow: hidden; text-align: center; line-height: 1.1; overflow-wrap: break-word; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }

.controle-destaque { background: var(--g-coral); color: #fff; }
.controle-destaque .ti { color: #fff; }
.controle-destaque .controle-texto { font-family: var(--g-fonte-titulo); letter-spacing: 0.01em; }
</style>
