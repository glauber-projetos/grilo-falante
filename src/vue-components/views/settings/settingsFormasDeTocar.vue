<template>
    <div class="aj-formas">
        <ul class="aj-metodos">
            <li v-for="metodo in metodos" :key="metodo.id">
                <button class="aj-metodo" :id="'ajMetodo-' + metodo.id" @click="abrir(metodo.modal)">
                    <span class="aj-metodo-icone" aria-hidden="true"><i :class="'ti ti-' + metodo.icone"></i></span>
                    <span class="aj-metodo-textos">
                        <span class="aj-metodo-titulo">{{ $t(metodo.titulo) }}</span>
                        <span class="aj-metodo-resumo">{{ $t(metodo.resumo) }}</span>
                        <span class="g-pilula" :class="{ 'g-pilula-ok': ligado(metodo) }">{{ ligado(metodo) ? $t('ajustesFormasLigado') : $t('ajustesFormasDesligado') }}</span>
                    </span>
                    <i class="ti ti-chevron-right aj-metodo-seta" aria-hidden="true"></i>
                </button>
            </li>
        </ul>

        <h3 class="aj-sub">{{ $t('ajustesFormasParaTodas') }}</h3>
        <ajuste-deslizar id="ajPausa" :label="$t('ajustesFormasPausa')" min="0" max="10000" step="200" decimals="1" display-factor="0.001" unit="s"
                         :dica="$t('ajustesFormasPausaDica')"
                         v-model.number="metadata.inputConfig.globalMinPauseCollectSpeak" @change="saveMetadata(metadata)"/>
        <label class="g-marcar">
            <input type="checkbox" id="chkReadActive" v-model="metadata.inputConfig.globalReadActive" @change="saveMetadata(metadata)"/>
            <span>{{ $t('ajustesFormasLerDestacado') }}</span>
        </label>
        <ajuste-deslizar v-if="metadata.inputConfig.globalReadActive" id="readActiveRate" :label="$t('ajustesFormasLerVelocidade')" min="0.1" max="10" step="0.1" decimals="1" :padrao="1"
                         v-model.number="metadata.inputConfig.globalReadActiveRate" @change="saveMetadata(metadata)"/>
        <label class="g-marcar">
            <input type="checkbox" id="beepFeedback" v-model="metadata.inputConfig.globalBeepFeedback" @change="saveMetadata(metadata)"/>
            <span>{{ $t('ajustesFormasBipe') }}</span>
        </label>
        <label class="g-marcar">
            <input type="checkbox" id="readAdditional" v-model="metadata.inputConfig.globalReadAdditionalActions" @change="saveMetadata(metadata)"/>
            <span>{{ $t('ajustesFormasLerAcoes') }}</span>
        </label>

        <mouse-modal v-if="modalAberto === 'MOUSE'" @close="fechar"/>
        <scanning-modal v-if="modalAberto === 'SCANNING'" @close="fechar"/>
        <direction-input-modal v-if="modalAberto === 'DIRECTION'" @close="fechar"/>
        <sequential-input-modal v-if="modalAberto === 'SEQUENTIAL'" @close="fechar"/>
        <huffman-input-modal v-if="modalAberto === 'HUFFMAN'" @close="fechar"/>
    </div>
</template>

<script>
    import { dataService } from '../../../js/service/data/dataService';
    import { settingsSaveMixin } from './settingsSaveMixin';
    import AjusteDeslizar from './ajusteDeslizar.vue';
    import MouseModal from '../../modals/input/mouseModal.vue';
    import ScanningModal from '../../modals/input/scanningModal.vue';
    import DirectionInputModal from '../../modals/input/directionInputModal.vue';
    import SequentialInputModal from '../../modals/input/sequentialInputModal.vue';
    import HuffmanInputModal from '../../modals/input/huffmanInputModal.vue';

    /**
     * Ajustes > Formas de tocar: the inherited input methods (touch, dwell/eye, scanning with switches, arrows,
     * step by step, codes). Each one opens its own window, which saves metadata.inputConfig by itself.
     * The options for all methods (globalInputOptions before) are here with the new look.
     */
    export default {
        components: { AjusteDeslizar, MouseModal, ScanningModal, DirectionInputModal, SequentialInputModal, HuffmanInputModal },
        props: ["metadata", "userSettingsLocal"],
        mixins: [settingsSaveMixin],
        data() {
            return {
                modalAberto: null,
                metodos: [
                    { id: 'tocar', icone: 'hand-finger', modal: 'MOUSE', campo: 'mouseclickEnabled', titulo: 'ajustesFormasTocar', resumo: 'ajustesFormasTocarResumo' },
                    { id: 'olhar', icone: 'eye', modal: 'MOUSE', campo: 'hoverEnabled', titulo: 'ajustesFormasOlhar', resumo: 'ajustesFormasOlharResumo' },
                    { id: 'varredura', icone: 'focus-2', modal: 'SCANNING', campo: 'scanEnabled', titulo: 'ajustesFormasVarredura', resumo: 'ajustesFormasVarreduraResumo' },
                    { id: 'passo', icone: 'player-track-next', modal: 'SEQUENTIAL', campo: 'seqEnabled', titulo: 'ajustesFormasPasso', resumo: 'ajustesFormasPassoResumo' },
                    { id: 'setas', icone: 'arrows-move', modal: 'DIRECTION', campo: 'dirEnabled', titulo: 'ajustesFormasSetas', resumo: 'ajustesFormasSetasResumo' },
                    { id: 'codigos', icone: 'binary-tree', modal: 'HUFFMAN', campo: 'huffEnabled', titulo: 'ajustesFormasCodigos', resumo: 'ajustesFormasCodigosResumo' }
                ]
            };
        },
        methods: {
            ligado(metodo) {
                return !!(this.metadata.inputConfig && this.metadata.inputConfig[metodo.campo]);
            },
            abrir(modal) {
                this.modalAberto = modal;
            },
            async fechar() {
                this.modalAberto = null;
                // the window saved the input config itself: take it over, so a later save here doesn't undo it
                let atual = await dataService.getMetadata();
                if (atual && atual.inputConfig) {
                    this.metadata.inputConfig = JSON.parse(JSON.stringify(atual.inputConfig));
                }
            }
        }
    };
</script>

<style scoped>
    .aj-metodos {
        list-style: none;
        margin: 0 0 var(--g-e5);
        padding: 0;
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: var(--g-e3);
    }
    .aj-metodos li { margin: 0; }
    .aj-metodo {
        box-sizing: border-box;
        width: 100%;
        min-height: 88px;
        height: 100%;
        display: flex;
        align-items: flex-start;
        gap: var(--g-e3);
        padding: var(--g-e4);
        margin: 0;
        border: 2px solid var(--g-borda);
        border-radius: var(--g-raio);
        background: var(--g-superficie);
        color: var(--g-tinta);
        text-align: left;
        text-transform: none;
        letter-spacing: 0;
        font-family: var(--g-fonte);
        font-size: var(--g-t-corpo);
        font-weight: 400;
        line-height: 1.35;
        white-space: normal;
        cursor: pointer;
        transition: border-color var(--g-rapido), transform var(--g-rapido) var(--g-curva);
    }
    .aj-metodo:hover { border-color: var(--g-borda-forte); }
    .aj-metodo:active { transform: scale(0.98); }
    .aj-metodo:focus-visible { outline: none; box-shadow: var(--g-foco); }
    .aj-metodo-icone {
        flex: none;
        width: 48px;
        height: 48px;
        border-radius: var(--g-raio-p);
        background: var(--g-ceu);
        color: var(--g-ceu-escuro);
        display: grid;
        place-items: center;
        font-size: 26px;
    }
    .aj-metodo-textos { flex: 1; min-width: 0; display: flex; flex-direction: column; }
    .aj-metodo-titulo { font-weight: 700; font-size: var(--g-t-grande); }
    .aj-metodo-resumo { color: var(--g-tinta-2); font-size: var(--g-t-legenda); }
    .aj-metodo .g-pilula { align-self: flex-start; margin-top: var(--g-e2); min-height: 28px; }
    .aj-metodo-seta { flex: none; color: var(--g-tinta-3); font-size: 21px; align-self: center; }
    @media (max-width: 420px) {
        .aj-metodos { grid-template-columns: minmax(0, 1fr); }
        .aj-metodo-seta { display: none; }
    }
</style>
