<template>
    <div class="painel-resp">
        <hold-to-unlock class="painel-resp-gatilho" :duration="modoCrianca ? segurarMs : 0"
                        :icone="modoCrianca ? 'lock' : 'user-shield'" tabindex="50"
                        @pronto="$emit('quer-abrir')"/>

        <template v-if="aberto">
            <div class="g-veu" @click="fechar()"></div>
            <div ref="painel" class="g-painel painel-resp-folha" role="dialog" aria-modal="true" aria-labelledby="painelRespTitulo"
                 @keydown.esc.stop="fechar()" @keydown.tab="prenderFoco">
                <div class="g-painel-alca" aria-hidden="true"></div>
                <div class="painel-resp-topo">
                    <img v-if="vista === VISTA_INICIO" src="app/img/grilo/mascote/grilo-confiante.webp" alt="" aria-hidden="true" class="painel-resp-grilo"/>
                    <h2 id="painelRespTitulo" class="painel-resp-titulo">{{ vista === VISTA_ENTRADA ? $t('pranchaFormasDeTocar') : $t('pranchaOlaOQueVamosFazer') }}</h2>
                    <button type="button" class="g-btn g-btn-icone g-btn-leve" @click="vista === VISTA_ENTRADA ? vista = VISTA_INICIO : fechar()"
                            :aria-label="vista === VISTA_ENTRADA ? $t('back') : $t('close')" :title="vista === VISTA_ENTRADA ? $t('back') : $t('close')">
                        <i :class="vista === VISTA_ENTRADA ? 'ti ti-arrow-left' : 'ti ti-x'" aria-hidden="true"></i>
                    </button>
                </div>

                <template v-if="vista === VISTA_INICIO">
                    <button type="button" class="painel-resp-modo" :class="{ligado: modoCrianca}" role="switch" :aria-checked="String(!!modoCrianca)"
                            @click="escolher('modo')">
                        <i :class="modoCrianca ? 'ti ti-lock' : 'ti ti-lock-open'" aria-hidden="true"></i>
                        <span class="painel-resp-modo-texto">
                            <b>{{ $t('pranchaModoCrianca') }}: {{ modoCrianca ? $t('pranchaLigado') : $t('pranchaDesligado') }}</b>
                            <small>{{ modoCrianca ? $t('pranchaModoCriancaLigadoDica') : $t('pranchaModoCriancaDesligadoDica') }}</small>
                        </span>
                        <span class="painel-resp-chave" aria-hidden="true"><span></span></span>
                    </button>

                    <div class="painel-resp-ladrilhos">
                        <button v-for="item in ladrilhos" :key="item.acao" type="button" class="g-ladrilho painel-resp-ladrilho" :class="item.classe"
                                @click="escolher(item.acao)">
                            <i :class="'ti ti-' + item.icone" aria-hidden="true"></i>
                            <span>{{ $t(item.texto) }}<small v-if="item.dica">{{ $t(item.dica) }}</small></span>
                        </button>
                    </div>

                    <div class="painel-resp-mais">
                        <button type="button" class="g-btn g-btn-leve" @click="escolher('procurar')">
                            <i class="ti ti-search" aria-hidden="true"></i>{{ $t('pranchaProcurarBotao') }}
                        </button>
                        <button type="button" class="g-btn g-btn-leve" @click="vista = VISTA_ENTRADA">
                            <i class="ti ti-hand-finger" aria-hidden="true"></i>{{ $t('pranchaFormasDeTocar') }}
                        </button>
                        <button type="button" class="g-btn g-btn-leve" @click="escolher('telaCheia')">
                            <i :class="telaCheia ? 'ti ti-arrows-minimize' : 'ti ti-arrows-maximize'" aria-hidden="true"></i>{{ telaCheia ? $t('pranchaSairTelaCheia') : $t('pranchaTelaCheia') }}
                        </button>
                    </div>
                </template>

                <template v-if="vista === VISTA_ENTRADA">
                    <p class="g-apoio painel-resp-texto">{{ $t('pranchaFormasDeTocarDica') }}</p>
                    <div class="g-coluna">
                        <button v-for="forma in formasDeTocar" :key="forma.modal" type="button" class="painel-resp-forma"
                                @click="escolher('entrada', forma.modal)">
                            <i :class="'ti ti-' + forma.icone" aria-hidden="true"></i>
                            <span class="painel-resp-forma-texto">{{ $t(forma.texto) }}</span>
                            <span v-if="forma.ativa" class="g-pilula g-pilula-ok">{{ $t('pranchaEmUso') }}</span>
                            <i class="ti ti-chevron-right" aria-hidden="true"></i>
                        </button>
                    </div>
                </template>
            </div>
        </template>
    </div>
</template>

<script>
/**
 * "Painel do Responsável" (Grilo Falante): the only way into the adult functions from the board.
 * - a discreet "Responsável" button in the corner: hold it (child mode) or tap it (adult mode)
 * - it emits "quer-abrir"; the board decides if a passcode is needed and then sets "aberto"
 * - the panel slides up from the bottom with big tiles and emits "escolher" (action, extra)
 *
 * actions: editar, foto, frases, pranchas, voz, aparencia, trocar, inicio, ajustes, modo,
 *          procurar, telaCheia, entrada (extra: modal type of the input method)
 *
 * events: quer-abrir, fechar, escolher
 */
import HoldToUnlock from './holdToUnlock.vue';

const VISTA_INICIO = 'VISTA_INICIO';
const VISTA_ENTRADA = 'VISTA_ENTRADA';

export default {
    components: { HoldToUnlock },
    props: {
        aberto: { type: Boolean, default: false },
        modoCrianca: { type: Boolean, default: false },
        segurarMs: { type: Number, default: 3000 },
        telaCheia: { type: Boolean, default: false },
        inputConfig: { type: Object, default: () => ({}) }
    },
    data() {
        return {
            vista: VISTA_INICIO,
            focoAntes: null,
            VISTA_INICIO, VISTA_ENTRADA,
            ladrilhos: [
                { acao: 'editar', icone: 'pencil', texto: 'pranchaEditarPrancha', classe: 'g-ladrilho-pessego' },
                { acao: 'foto', icone: 'camera', texto: 'pranchaFotoNova', dica: 'pranchaFotoNovaDica', classe: 'g-ladrilho-ceu' },
                { acao: 'frases', icone: 'star', texto: 'pranchaFrases', classe: 'g-ladrilho-girassol' },
                { acao: 'pranchas', icone: 'layout-grid', texto: 'pranchaPranchas' },
                { acao: 'voz', icone: 'volume', texto: 'pranchaVoz' },
                { acao: 'aparencia', icone: 'palette', texto: 'pranchaAparencia' },
                { acao: 'trocar', icone: 'user-circle', texto: 'pranchaTrocarCrianca' },
                { acao: 'inicio', icone: 'home', texto: 'pranchaInicio' },
                { acao: 'ajustes', icone: 'settings', texto: 'pranchaAjustes' }
            ]
        };
    },
    computed: {
        formasDeTocar() {
            let c = this.inputConfig || {};
            return [
                { modal: 'MODAL_MOUSE', icone: 'hand-finger', texto: 'pranchaTocarDireto', ativa: !!(c.mouseclickEnabled || c.hoverEnabled) },
                { modal: 'MODAL_SCANNING', icone: 'list-search', texto: 'pranchaVarredura', ativa: !!c.scanEnabled },
                { modal: 'MODAL_DIRECTION', icone: 'arrows-move', texto: 'pranchaSetas', ativa: !!c.dirEnabled },
                { modal: 'MODAL_HUFFMAN', icone: 'dots', texto: 'pranchaCodigoAcionadores', ativa: !!c.huffEnabled },
                { modal: 'MODAL_SEQUENTIAL', icone: 'arrow-right', texto: 'pranchaUmPorUm', ativa: !!c.seqEnabled }
            ];
        }
    },
    watch: {
        aberto(value) {
            if (value) {
                this.vista = VISTA_INICIO;
                this.focoAntes = document.activeElement;
                this.$nextTick(() => this.focarPrimeiro());
            } else if (this.focoAntes && this.focoAntes.focus) {
                this.focoAntes.focus();
                this.focoAntes = null;
            }
        },
        vista() {
            this.$nextTick(() => this.focarPrimeiro());
        }
    },
    methods: {
        escolher(acao, extra) {
            this.$emit('escolher', acao, extra);
        },
        fechar() {
            this.$emit('fechar');
        },
        focaveis() {
            return this.$refs.painel ? Array.from(this.$refs.painel.querySelectorAll('button:not([disabled])')) : [];
        },
        focarPrimeiro() {
            let list = this.focaveis();
            let first = list.find(b => !b.classList.contains('g-btn-icone')) || list[0];
            if (first) {
                first.focus();
            }
        },
        prenderFoco(event) {
            let list = this.focaveis();
            if (list.length === 0) {
                return;
            }
            let first = list[0];
            let last = list[list.length - 1];
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        }
    }
};
</script>

<style scoped>
.painel-resp-folha {
    font-family: var(--g-fonte);
    color: var(--g-tinta);
    padding-bottom: calc(var(--g-e5) + env(safe-area-inset-bottom, 0px));
}
.painel-resp-topo {
    display: flex;
    align-items: center;
    gap: var(--g-e3);
    margin: 0 calc(-1 * var(--g-e2)) var(--g-e4);
    padding: var(--g-e2);
    position: sticky; /* title and close button stay visible while the panel scrolls (phone) */
    top: calc(-1 * var(--g-e3));
    z-index: 1;
    background: var(--g-superficie);
}
.painel-resp-grilo { width: 40px; height: 40px; object-fit: contain; flex: none; }
.painel-resp-titulo {
    flex: 1;
    margin: 0;
    font-family: var(--g-fonte-titulo);
    font-size: var(--g-t-h2);
    font-weight: 700;
    line-height: 1.15;
    color: var(--g-tinta);
}

/* Modo Criança: interruptor grande no alto do painel */
.painel-resp-modo {
    display: flex;
    align-items: center;
    gap: var(--g-e4);
    width: 100%;
    min-height: 72px;
    height: auto;
    margin: 0 0 var(--g-e4);
    padding: var(--g-e3) var(--g-e4);
    border: 2px solid var(--g-borda);
    border-radius: var(--g-raio-g);
    background: var(--g-superficie);
    color: var(--g-tinta);
    font-family: var(--g-fonte);
    text-align: left;
    text-transform: none;
    letter-spacing: 0;
    line-height: 1.25;
    white-space: normal;
    cursor: pointer;
}
.painel-resp-modo.ligado { background: var(--g-folha-clara); border-color: var(--g-folha); }
.painel-resp-modo > .ti { font-size: 32px; color: var(--g-folha-escura); flex: none; }
.painel-resp-modo-texto { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.painel-resp-modo-texto b { font-size: var(--g-t-grande); }
.painel-resp-modo-texto small { font-size: var(--g-t-legenda); color: var(--g-tinta-2); font-weight: 400; }
.painel-resp-chave {
    flex: none;
    width: 56px;
    height: 32px;
    border-radius: var(--g-raio-pilula);
    background: var(--g-borda-forte);
    position: relative;
    transition: background var(--g-rapido);
}
.painel-resp-chave span {
    position: absolute;
    top: 4px;
    left: 4px;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: #fff;
    transition: transform var(--g-medio) var(--g-curva);
}
.painel-resp-modo.ligado .painel-resp-chave { background: var(--g-folha); }
.painel-resp-modo.ligado .painel-resp-chave span { transform: translateX(24px); }

.painel-resp-ladrilhos {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    grid-auto-rows: 1fr;
    gap: var(--g-e3);
}
.painel-resp-ladrilho {
    min-height: 104px;
    background: var(--g-superficie-2);
    color: var(--g-tinta);
}
.painel-resp-ladrilho .ti { color: var(--g-folha-escura); }
.painel-resp-ladrilho.g-ladrilho-pessego { background: var(--g-pessego); color: var(--g-pessego-escuro); }
.painel-resp-ladrilho.g-ladrilho-ceu { background: var(--g-ceu); color: var(--g-ceu-escuro); }
.painel-resp-ladrilho.g-ladrilho-girassol { background: var(--g-girassol-claro); color: #4a3b00; }
.painel-resp-ladrilho.g-ladrilho-pessego .ti { color: var(--g-coral-escuro); }
.painel-resp-ladrilho.g-ladrilho-ceu .ti { color: var(--g-ceu-escuro); }
.painel-resp-ladrilho.g-ladrilho-girassol .ti { color: #4a3b00; }
.painel-resp-ladrilho:focus { outline: none; }
.painel-resp-ladrilho:focus-visible, .painel-resp-modo:focus-visible, .painel-resp-forma:focus-visible { outline: none; box-shadow: var(--g-foco); }

.painel-resp-mais {
    display: flex;
    flex-wrap: wrap;
    gap: var(--g-e2);
    margin-top: var(--g-e4);
    padding-top: var(--g-e3);
    border-top: 2px solid var(--g-superficie-2);
}
.painel-resp-mais .g-btn { padding: 0 var(--g-e3); }

.painel-resp-texto { margin: 0 0 var(--g-e4); }
.painel-resp-forma {
    display: flex;
    align-items: center;
    gap: var(--g-e3);
    width: 100%;
    min-height: var(--g-alvo-g);
    height: auto;
    margin: 0;
    padding: var(--g-e2) var(--g-e4);
    border: 2px solid var(--g-borda);
    border-radius: var(--g-raio);
    background: var(--g-superficie);
    color: var(--g-tinta);
    font-family: var(--g-fonte);
    font-size: var(--g-t-grande);
    font-weight: 700;
    text-align: left;
    text-transform: none;
    letter-spacing: 0;
    line-height: 1.2;
    white-space: normal;
    cursor: pointer;
}
.painel-resp-forma > .ti { font-size: 25.6px; color: var(--g-folha-escura); flex: none; }
.painel-resp-forma-texto { flex: 1; min-width: 0; }

@media (max-width: 420px) {
    .painel-resp-ladrilhos { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--g-e2); }
    .painel-resp-ladrilho { min-height: 92px; padding: var(--g-e3); font-size: var(--g-t-corpo); }
    .painel-resp-ladrilho .ti { font-size: 28.8px; }
    .painel-resp-titulo { font-size: var(--g-t-h3); }
}
@media (max-height: 520px) and (orientation: landscape) {
    .painel-resp-ladrilhos { grid-template-columns: repeat(5, minmax(0, 1fr)); }
    .painel-resp-ladrilho { min-height: 84px; }
}
</style>
<style scoped>
/* child mode blocks touch gestures on the board (custom.css); the panel must still scroll */
body.ui-locked #gridView .painel-resp-folha,
body.ui-locked #gridView .painel-resp-folha * {
    touch-action: pan-y;
}
</style>
