<template>
    <div class="gm-veu" @mousedown.self="fecharPeloVeu" @dragenter.prevent @dragover.prevent @drop.prevent>
        <div ref="janela" class="gm-janela g-tela" :class="'gm-' + (tamanho || 'm')" role="dialog" aria-modal="true"
             :aria-labelledby="idTitulo" @keydown.esc.stop="$emit('close')" @keydown.tab="prenderFoco">
            <header class="gm-cabeca">
                <span v-if="icone" class="gm-cabeca-icone" :class="{'gm-cabeca-perigo': perigo}" aria-hidden="true"><i :class="'ti ti-' + icone"></i></span>
                <div class="gm-cabeca-texto">
                    <h2 :id="idTitulo" class="gm-titulo">{{ titulo }}</h2>
                    <p v-if="subtitulo" class="gm-subtitulo">{{ subtitulo }}</p>
                </div>
                <slot name="cabeca"></slot>
                <button type="button" class="g-btn g-btn-leve g-btn-icone gm-fechar" @click="$emit('close')" :aria-label="$t('gestaoFechar')" :title="$t('gestaoFechar')">
                    <i class="ti ti-x" aria-hidden="true"></i>
                </button>
            </header>
            <div v-if="$slots.abas" class="gm-abas-area">
                <slot name="abas"></slot>
            </div>
            <div class="gm-corpo" ref="corpo">
                <slot></slot>
            </div>
            <footer v-if="$slots.rodape" class="gm-rodape">
                <slot name="rodape"></slot>
            </footer>
        </div>
    </div>
</template>

<script>
    /**
     * Moldura comum dos modais da área de gestão (pranchas, edição de botão, importar, exportar...).
     * Uso:
     *   <gestao-modal :titulo="..." icone="pencil" tamanho="m|g|p" @close="...">
     *       <template #abas> <gestao-abas .../> </template>   (opcional)
     *       ...conteúdo...
     *       <template #rodape> <button class="g-btn">Cancelar</button> <button class="g-btn g-btn-principal">Salvar</button> </template>
     *   </gestao-modal>
     * As classes de apoio gm-* (seções, grade de campos, "Avançado" recolhido) estão no <style> abaixo (não escopado).
     */
    let contador = 0;
    export default {
        props: {
            titulo: String,
            subtitulo: String,
            icone: String,
            tamanho: String, // 'p' (pequeno), 'm' (padrão), 'g' (grande)
            fecharNoVeu: {type: Boolean, default: false},
            perigo: {type: Boolean, default: false} // ícone vermelho (apagar, avisos sérios)
        },
        data() {
            contador++;
            return {
                idTitulo: 'gm-titulo-' + contador,
                focoAnterior: null
            };
        },
        methods: {
            fecharPeloVeu() {
                if (this.fecharNoVeu) {
                    this.$emit('close');
                }
            },
            focaveis() {
                if (!this.$refs.janela) return [];
                let sel = 'button:not([disabled]), [href], input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
                return Array.from(this.$refs.janela.querySelectorAll(sel)).filter(el => el.offsetParent !== null);
            },
            prenderFoco(event) {
                let lista = this.focaveis();
                if (lista.length === 0) return;
                let primeiro = lista[0];
                let ultimo = lista[lista.length - 1];
                if (event.shiftKey && document.activeElement === primeiro) {
                    ultimo.focus();
                    event.preventDefault();
                } else if (!event.shiftKey && document.activeElement === ultimo) {
                    primeiro.focus();
                    event.preventDefault();
                }
            }
        },
        mounted() {
            this.focoAnterior = document.activeElement;
            this.$nextTick(() => {
                if (!this.$refs.janela) return;
                let jaFocado = this.$refs.janela.contains(document.activeElement);
                if (jaFocado) return;
                let alvo = this.$refs.janela.querySelector('[autofocus], .gm-corpo input:not([type="hidden"]), .gm-corpo select, .gm-corpo textarea');
                (alvo || this.$refs.janela.querySelector('.gm-fechar')).focus();
            });
        },
        beforeDestroy() {
            if (this.focoAnterior && this.focoAnterior.focus && document.body.contains(this.focoAnterior)) {
                try { this.focoAnterior.focus(); } catch (e) {}
            }
        }
    }
</script>

<style>
/* ---------- moldura ---------- */
.gm-veu {
    position: fixed; inset: 0; z-index: 9998;
    background: rgba(20, 32, 15, 0.45);
    display: flex; align-items: center; justify-content: center;
    padding: var(--g-e4);
    animation: g-aparecer var(--g-medio) var(--g-curva);
}
.gm-janela.g-tela {
    min-height: 0;
    width: 100%;
    max-width: 760px;
    max-height: calc(100vh - 2 * var(--g-e4));
    max-height: calc(100dvh - 2 * var(--g-e4));
    display: flex; flex-direction: column;
    background: var(--g-fundo);
    border-radius: var(--g-raio-g);
    box-shadow: var(--g-sombra);
    overflow: hidden;
    text-align: left;
}
.gm-janela.gm-p { max-width: 520px; }
.gm-janela.gm-g { max-width: 980px; }
.gm-cabeca {
    display: flex; align-items: center; gap: var(--g-e3);
    padding: var(--g-e4) var(--g-e4) var(--g-e3) var(--g-e5);
    background: var(--g-superficie);
    border-bottom: 1px solid var(--g-borda);
}
.gm-cabeca-icone {
    width: 44px; height: 44px; flex: none; border-radius: var(--g-raio);
    display: grid; place-items: center;
    background: var(--g-folha-clara); color: var(--g-folha-escura); font-size: 24px;
}
.gm-cabeca-icone.gm-cabeca-perigo { background: var(--g-perigo-claro); color: var(--g-perigo); }
.gm-cabeca-texto { flex: 1; min-width: 0; }
.gm-janela .gm-titulo { font-size: var(--g-t-h3); margin: 0; overflow-wrap: anywhere; }
.gm-subtitulo { margin: 2px 0 0; color: var(--g-tinta-2); font-size: var(--g-t-legenda); }
.gm-fechar { flex: none; color: var(--g-tinta-2); }
.gm-abas-area { background: var(--g-superficie); padding: 0 var(--g-e4) var(--g-e3); border-bottom: 1px solid var(--g-borda); }
.gm-corpo { flex: 1; min-height: 0; overflow-y: auto; overflow-x: hidden; padding: var(--g-e5); }
.gm-rodape {
    display: flex; flex-wrap: wrap; align-items: center; justify-content: flex-end; gap: var(--g-e3);
    padding: var(--g-e3) var(--g-e5);
    background: var(--g-superficie);
    border-top: 1px solid var(--g-borda);
}
.gm-rodape .gm-rodape-esq { margin-right: auto; display: flex; flex-wrap: wrap; gap: var(--g-e2); }

@media (max-width: 600px) {
    .gm-veu { padding: 0; align-items: flex-end; }
    .gm-janela.g-tela, .gm-janela.gm-p, .gm-janela.gm-g {
        max-width: none; max-height: 100%; height: 100%;
        border-radius: 0;
    }
    .gm-cabeca { padding: var(--g-e3) var(--g-e2) var(--g-e3) var(--g-e4); }
    .gm-corpo { padding: var(--g-e4); }
    .gm-rodape { padding: var(--g-e3) var(--g-e4); }
    .gm-rodape > .g-btn { flex: 1 1 40%; }
    .gm-rodape .gm-rodape-esq { flex: 1 1 100%; margin-right: 0; }
}

/* ---------- abas (segmentos) ---------- */
.gm-abas { display: flex; gap: var(--g-e2); overflow-x: auto; padding: 2px; margin: 0; list-style: none; scrollbar-width: thin; }
.gm-aba {
    display: inline-flex; align-items: center; gap: var(--g-e2); flex: none;
    min-height: var(--g-alvo); padding: 0 var(--g-e4); margin: 0;
    border-radius: var(--g-raio-pilula); border: 2px solid var(--g-borda);
    background: var(--g-superficie); color: var(--g-tinta);
    font-family: var(--g-fonte); font-size: var(--g-t-corpo); font-weight: 700;
    text-transform: none; letter-spacing: 0; height: auto; line-height: 1.2; cursor: pointer;
}
.gm-aba .ti { font-size: 1.3em; }
.gm-aba:hover { border-color: var(--g-borda-forte); }
.gm-aba[aria-selected="true"] { background: var(--g-folha); border-color: var(--g-folha); color: #fff; }
.gm-aba:focus-visible { outline: none; box-shadow: var(--g-foco); }

/* ---------- conteúdo ---------- */
.gm-secao {
    background: var(--g-superficie); border: 2px solid var(--g-borda); border-radius: var(--g-raio-g);
    padding: var(--g-e4) var(--g-e5); margin-bottom: var(--g-e4);
}
.gm-secao > h3, .gm-secao-titulo { font-family: var(--g-fonte-titulo); font-size: var(--g-t-grande); font-weight: 700; margin: 0 0 var(--g-e3); display: flex; align-items: center; gap: var(--g-e2); }
.gm-secao > h3 .ti, .gm-secao-titulo .ti { color: var(--g-folha-escura); font-size: 1.3em; }
.gm-secao > :last-child { margin-bottom: 0; }
.gm-grade { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0 var(--g-e4); }
.gm-grade-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.gm-grade > .gm-inteira { grid-column: 1 / -1; }
@media (max-width: 600px) {
    .gm-grade, .gm-grade-3 { grid-template-columns: minmax(0, 1fr); }
    .gm-secao { padding: var(--g-e4); }
    /* on phones the tabs wrap instead of hiding behind a sideways scroll */
    .gm-abas { display: grid; grid-template-columns: repeat(auto-fill, minmax(104px, 1fr)); overflow-x: visible; }
    .gm-aba { padding: var(--g-e1) var(--g-e3); justify-content: center; text-align: center; white-space: normal; font-size: var(--g-t-legenda); border-radius: var(--g-raio); }
}
.gm-campo-linha { display: flex; gap: var(--g-e2); align-items: stretch; }
.gm-campo-linha > input, .gm-campo-linha > select { flex: 1; min-width: 0; }
.gm-janela .g-campo input[type="range"] { width: 100%; min-height: var(--g-alvo); accent-color: var(--g-folha); margin: 0; }
.gm-janela .g-campo input[type="color"] { width: 100%; min-height: var(--g-alvo); border-radius: var(--g-raio); border: 2px solid var(--g-borda); padding: 4px; background: var(--g-superficie); margin: 0; }
/* empty color (no value) shows as stripes instead of black */
.gm-janela input[type="color"].gm-cor-vazia::-webkit-color-swatch { background-image: repeating-linear-gradient(45deg, #fff, #fff 6px, #e9e4d6 6px, #e9e4d6 12px); }
.gm-janela input[type="color"].gm-cor-vazia::-moz-color-swatch { background-image: repeating-linear-gradient(45deg, #fff, #fff 6px, #e9e4d6 6px, #e9e4d6 12px); }
.gm-janela .g-campo input[type="url"], .gm-janela .g-campo input[type="search"] {
    width: 100%; min-height: var(--g-alvo); padding: var(--g-e2) var(--g-e3);
    border: 2px solid var(--g-borda); border-radius: var(--g-raio); background: var(--g-superficie);
    color: var(--g-tinta); font-family: var(--g-fonte); font-size: var(--g-t-grande); margin: 0; box-shadow: none;
}
.gm-janela input[type="search"]::-webkit-search-cancel-button, .gm-janela input[type="search"]::-webkit-search-decoration { -webkit-appearance: none; display: none; }
.gm-janela .g-marcar { margin-bottom: var(--g-e2); font-weight: 400; }
.gm-janela .g-marcar > span, .gm-janela .g-marcar > label { margin: 0; font-weight: 400; }
.gm-janela .g-campo textarea { min-height: 96px; resize: vertical; }

/* "Avançado" recolhido: <details class="gm-avancado"><summary>Avançado</summary>...</details> */
.gm-avancado { border: 2px dashed var(--g-borda-forte); border-radius: var(--g-raio-g); background: var(--g-superficie-2); margin: var(--g-e4) 0; }
.gm-avancado > summary {
    display: flex; align-items: center; gap: var(--g-e2); min-height: var(--g-alvo);
    padding: var(--g-e2) var(--g-e4); cursor: pointer; list-style: none;
    font-weight: 700; color: var(--g-tinta-2); border-radius: var(--g-raio-g);
}
.gm-avancado > summary::-webkit-details-marker { display: none; }
.gm-avancado > summary::before { content: "\ea61"; font-family: "tabler-icons-outline"; font-size: 1.3em; transition: transform var(--g-rapido); }
.gm-avancado[open] > summary::before { transform: rotate(90deg); }
.gm-avancado > summary:focus-visible { outline: none; box-shadow: var(--g-foco); }
.gm-avancado > .gm-avancado-corpo { padding: 0 var(--g-e4) var(--g-e4); }

/* lista de itens com ações (ex.: ações do botão) */
.gm-lista { list-style: none; margin: 0 0 var(--g-e4); padding: 0; display: flex; flex-direction: column; gap: var(--g-e2); }
.gm-lista > li {
    display: flex; align-items: center; gap: var(--g-e3); flex-wrap: wrap;
    background: var(--g-superficie); border: 2px solid var(--g-borda); border-radius: var(--g-raio);
    padding: var(--g-e2) var(--g-e2) var(--g-e2) var(--g-e4); margin: 0;
}
.gm-lista > li > .gm-lista-texto { flex: 1; min-width: 0; font-weight: 700; overflow-wrap: anywhere; }
.gm-lista > li > .gm-lista-texto small { display: block; font-weight: 400; color: var(--g-tinta-2); }

/* escolhas grandes (cartões clicáveis tipo rádio) */
.gm-escolhas { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: var(--g-e2); margin-bottom: var(--g-e4); }
.gm-escolha {
    display: flex; flex-direction: column; align-items: flex-start; gap: var(--g-e1);
    min-height: 72px; padding: var(--g-e3); margin: 0; height: auto;
    border-radius: var(--g-raio); border: 2px solid var(--g-borda); background: var(--g-superficie);
    font-family: var(--g-fonte); font-size: var(--g-t-corpo); font-weight: 700; text-transform: none; letter-spacing: 0;
    line-height: 1.25; text-align: left; white-space: normal; color: var(--g-tinta); cursor: pointer;
}
.gm-escolha .ti { font-size: 25.6px; color: var(--g-folha-escura); }
.gm-escolha small { font-weight: 400; color: var(--g-tinta-2); }
.gm-escolha[aria-pressed="true"], .gm-escolha.gm-escolhida { border-color: var(--g-folha); background: var(--g-folha-clara); }
.gm-escolha:focus-visible { outline: none; box-shadow: var(--g-foco); }

.gm-vazio { text-align: center; color: var(--g-tinta-2); padding: var(--g-e5) var(--g-e3); }
.gm-vazio .ti { font-size: 40px; display: block; margin: 0 auto var(--g-e2); color: var(--g-tinta-3); }
</style>
