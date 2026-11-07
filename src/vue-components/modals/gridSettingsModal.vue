<template>
    <gestao-modal :titulo="$t('gestaoEdicaoAjustesTitulo')" :subtitulo="$t('gestaoEdicaoAjustesSubtitulo')" icone="adjustments" tamanho="m"
                  @close="$emit('close')" @keyup.ctrl.enter.native="save()">
        <section class="gm-secao">
            <h3><i class="ti ti-layout-grid" aria-hidden="true"></i>{{ $t('gestaoEdicaoTamanho') }}</h3>
            <div class="ag-tamanho">
                <div class="ag-passos">
                    <div class="g-campo">
                        <label for="gridRows">{{ $t('gestaoEdicaoLinhas') }}</label>
                        <div class="ag-passo">
                            <button type="button" class="g-btn ag-passo-btn" @click="mudar('rowCount', -1)" :disabled="gridData.rowCount <= 1"
                                    :aria-label="$t('gestaoEdicaoMenosLinha')" :title="$t('gestaoEdicaoMenosLinha')">
                                <i class="ti ti-minus" aria-hidden="true"></i>
                            </button>
                            <input id="gridRows" type="number" inputmode="numeric" v-model.number="gridData.rowCount" min="1" :max="gridLayoutUtil.MAX_GRID_SIZE"/>
                            <button type="button" class="g-btn ag-passo-btn" @click="mudar('rowCount', 1)" :disabled="gridData.rowCount >= gridLayoutUtil.MAX_GRID_SIZE"
                                    :aria-label="$t('gestaoEdicaoMaisLinha')" :title="$t('gestaoEdicaoMaisLinha')">
                                <i class="ti ti-plus" aria-hidden="true"></i>
                            </button>
                        </div>
                    </div>
                    <div class="g-campo">
                        <label for="gridCols">{{ $t('gestaoEdicaoColunas') }}</label>
                        <div class="ag-passo">
                            <button type="button" class="g-btn ag-passo-btn" @click="mudar('minColumnCount', -1)" :disabled="gridData.minColumnCount <= 1"
                                    :aria-label="$t('gestaoEdicaoMenosColuna')" :title="$t('gestaoEdicaoMenosColuna')">
                                <i class="ti ti-minus" aria-hidden="true"></i>
                            </button>
                            <input id="gridCols" type="number" inputmode="numeric" v-model.number="gridData.minColumnCount" min="1" :max="gridLayoutUtil.MAX_GRID_SIZE"/>
                            <button type="button" class="g-btn ag-passo-btn" @click="mudar('minColumnCount', 1)" :disabled="gridData.minColumnCount >= gridLayoutUtil.MAX_GRID_SIZE"
                                    :aria-label="$t('gestaoEdicaoMaisColuna')" :title="$t('gestaoEdicaoMaisColuna')">
                                <i class="ti ti-plus" aria-hidden="true"></i>
                            </button>
                        </div>
                    </div>
                </div>
                <div class="ag-previa" aria-hidden="true" :style="previaEstilo">
                    <span v-for="n in previa.linhas * previa.colunas" :key="n"></span>
                </div>
            </div>
            <p class="g-dica ag-dica">{{ $t('gestaoEdicaoTamanhoDica') }}</p>
        </section>

        <section class="gm-secao" v-if="!isGlobalGrid">
            <h3><i class="ti ti-layout-navbar" aria-hidden="true"></i>{{ $t('gestaoBarraFixaTitulo') }}</h3>
            <label class="g-marcar">
                <input type="checkbox" id="showGlobalGrid" v-model="gridData.showGlobalGrid"/>
                <span>{{ $t('gestaoEdicaoMostrarBarra') }}<br/><small class="g-dica">{{ $t('gestaoBarraFixaTexto') }}</small></span>
            </label>
        </section>

        <section class="gm-secao">
            <h3><i class="ti ti-palette" aria-hidden="true"></i>{{ $t('gestaoEdicaoCorFundoTitulo') }}</h3>
            <div class="g-campo">
                <label for="bgColor">{{ $t('gestaoEdicaoCorFundo') }}</label>
                <div class="gm-campo-linha">
                    <input type="color" id="bgColor" :class="{'gm-cor-vazia': !gridData.backgroundColor}" v-if="gridData" v-model="gridData.backgroundColor"/>
                    <button type="button" class="g-btn" :disabled="!gridData.backgroundColor" @click="gridData.backgroundColor = null;">
                        <i class="ti ti-eraser" aria-hidden="true"></i>{{ $t('gestaoEdicaoTirarCor') }}
                    </button>
                </div>
                <span class="g-dica">{{ gridData.backgroundColor ? $t('gestaoEdicaoCorEscolhida') : $t('gestaoEdicaoCorPadrao') }}</span>
            </div>
        </section>

        <section class="gm-secao">
            <h3><i class="ti ti-keyboard" aria-hidden="true"></i>{{ $t('gestaoEdicaoTecladoTitulo') }}</h3>
            <div class="g-campo">
                <label for="keyboardMode">{{ $t('gestaoEdicaoTecladoPergunta') }}</label>
                <select id="keyboardMode" v-model="gridData.keyboardMode">
                    <option :value="null">{{ $t('gestaoEdicaoTecladoAuto') }}</option>
                    <option v-for="mode in GridData.KEYBOARD_MODES" :value="mode">{{ $t(mode) }}</option>
                </select>
                <span class="g-dica">{{ $t('gestaoEdicaoTecladoDica') }}</span>
            </div>
        </section>

        <template #rodape>
            <button type="button" class="g-btn" @click="$emit('close')" :title="$t('keyboardEsc')">{{ $t('gestaoCancelar') }}</button>
            <button type="button" class="g-btn g-btn-principal" @click="save()" :title="$t('keyboardCtrlEnter')">
                <i class="ti ti-check" aria-hidden="true"></i>{{ $t('gestaoSalvar') }}
            </button>
        </template>
    </gestao-modal>
</template>

<script>
    import GestaoModal from "./gestaoModal.vue";
    import {localStorageService} from "../../js/service/data/localStorageService";
    import {dataService} from "../../js/service/data/dataService";
    import { gridLayoutUtil } from '../grid-layout/utils/gridLayoutUtil';
    import { gridUtil } from '../../js/util/gridUtil';
    import { i18nService } from '../../js/service/i18nService';
    import { GridData } from '../../js/model/GridData';

    export default {
        components: {GestaoModal},
        props: ['gridDataParam', 'isGlobalGrid', 'undoService'],
        data: function () {
            return {
                gridData: JSON.parse(JSON.stringify(this.gridDataParam)),
                gridHeight: gridUtil.getHeight(this.gridDataParam),
                allGrids: [],
                gridLayoutUtil: gridLayoutUtil,
                GridData: GridData
            }
        },
        computed: {
            // só apresentação: desenho pequeno da prancha (limitado para não pesar)
            previa() {
                let lim = (v, max) => Math.max(1, Math.min(parseInt(v) || 1, max));
                return {linhas: lim(this.gridData.rowCount, 12), colunas: lim(this.gridData.minColumnCount, 12)};
            },
            previaEstilo() {
                let estilo = {
                    gridTemplateColumns: `repeat(${this.previa.colunas}, 1fr)`,
                    gridTemplateRows: `repeat(${this.previa.linhas}, 1fr)`,
                    aspectRatio: `${this.previa.colunas} / ${this.previa.linhas}`
                };
                if (this.gridData.backgroundColor) {
                    estilo.backgroundColor = this.gridData.backgroundColor;
                }
                return estilo;
            }
        },
        methods: {
            mudar(campo, passo) {
                let atual = parseInt(this.gridData[campo]) || 1;
                this.gridData[campo] = Math.max(1, Math.min(atual + passo, gridLayoutUtil.MAX_GRID_SIZE));
            },
            save() {
                this.gridData.rowCount = Math.min(this.gridData.rowCount, gridLayoutUtil.MAX_GRID_SIZE);
                this.gridData.minColumnCount = Math.min(this.gridData.minColumnCount, gridLayoutUtil.MAX_GRID_SIZE);
                localStorageService.saveLastGridDimensions({
                    rowCount: this.gridData.rowCount,
                    minColumnCount: this.gridData.minColumnCount
                });
                let promises = [];
                promises.push(this.undoService.updateGrid(this.gridData));
                Promise.all(promises).then(() => {
                    this.$emit('reload');
                    this.$emit('close');
                });
            }
        },
        async mounted() {
            this.allGrids = (await dataService.getGrids(false))
                .sort((a, b) => i18nService.getTranslation(a.label).localeCompare(i18nService.getTranslation(b.label)));
        }
    }
</script>

<style scoped>
.ag-tamanho {
    display: flex; flex-wrap: wrap; align-items: center; gap: var(--g-e4) var(--g-e5);
}
.ag-passos { flex: 1 1 260px; min-width: 0; }
.ag-passo { display: flex; align-items: stretch; gap: var(--g-e2); }
.ag-passo-btn { width: 56px; min-width: 56px; min-height: 56px; padding: 0; flex: none; }
.ag-passo-btn .ti { font-size: 1.6em; }
.ag-passo input[type="number"] {
    flex: 1; min-width: 0; max-width: 140px; min-height: 56px; margin: 0;
    text-align: center; font-size: var(--g-t-h3); font-weight: 700;
    -moz-appearance: textfield;
}
.ag-passo input[type="number"]::-webkit-inner-spin-button,
.ag-passo input[type="number"]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
.ag-previa {
    flex: none; height: 140px; width: auto; max-width: 100%;
    display: grid; gap: 3px; padding: 6px;
    background: var(--g-superficie-2); border: 2px solid var(--g-borda); border-radius: var(--g-raio);
}
.ag-previa > span { background: var(--g-superficie); border: 1px solid var(--g-borda-forte); border-radius: 3px; min-width: 0; min-height: 0; }
.ag-dica { margin: var(--g-e2) 0 0; }
.g-marcar small { font-size: var(--g-t-legenda); }
@media (max-width: 600px) {
    .ag-previa { height: 110px; margin: 0 auto; }
}
</style>
