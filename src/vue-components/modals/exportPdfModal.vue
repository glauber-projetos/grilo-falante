<template>
    <gestao-modal :titulo="$t('gestaoArquivoImprimirTitulo')" :subtitulo="$t('gestaoArquivoImprimirSubtitulo')" icone="printer"
                  @close="$emit('close')" @keyup.ctrl.enter.native="save()">
        <section class="gm-secao">
            <h3><i class="ti ti-layout-grid" aria-hidden="true"></i>{{ $t('gestaoArquivoQuaisPranchas') }}</h3>
            <div class="ar-escolha-prancha">
                <div class="g-campo ar-escolha-campo">
                    <label for="selectGrid">{{ $t('gestaoArquivoPrancha') }}</label>
                    <select id="selectGrid" v-model="selectedGrid" @change="selectedGridChanged">
                        <option :value="null">{{ $t('gestaoArquivoTodasAsPranchas', [graphList.length]) }}</option>
                        <option v-for="elem in graphList" :value="elem.grid" :key="elem.grid.id">{{elem.grid.label | extractTranslation}}</option>
                    </select>
                </div>
                <span class="ar-miniatura" aria-hidden="true">
                    <img v-if="selectedGrid && selectedGrid.thumbnail && selectedGrid.thumbnail.data" :src="selectedGrid.thumbnail.data" alt=""/>
                    <i v-else :class="selectedGrid ? 'ti ti-layout-grid' : 'ti ti-stack-2'"></i>
                </span>
            </div>
            <label class="g-marcar" v-show="selectedGrid && allChildren && allChildren.length > 0">
                <input id="exportConnected" type="checkbox" v-model="options.exportConnected"/>
                <span>{{ $t('gestaoArquivoImprimirJunto', [allChildren ? allChildren.length : 0]) }}</span>
            </label>
        </section>

        <section class="gm-secao">
            <h3 id="pdfComoTitulo"><i class="ti ti-file-text" aria-hidden="true"></i>{{ $t('gestaoArquivoComoImprimir') }}</h3>
            <div class="gm-escolhas ar-modos" role="group" aria-labelledby="pdfComoTitulo">
                <button type="button" class="gm-escolha" :aria-pressed="(pdfExportMode === pdfService.MODE_NORMAL).toString()" @click="pdfExportMode = pdfService.MODE_NORMAL">
                    <i class="ti ti-layout-grid" aria-hidden="true"></i>
                    <span>{{ $t('gestaoArquivoModoPagina') }}</span>
                    <small>{{ $t('gestaoArquivoModoPaginaDica') }}</small>
                </button>
                <button type="button" class="gm-escolha" :aria-pressed="(pdfExportMode === pdfService.MODE_RESIZE).toString()" @click="pdfExportMode = pdfService.MODE_RESIZE">
                    <i class="ti ti-scissors" aria-hidden="true"></i>
                    <span>{{ $t('gestaoArquivoModoCartoes') }}</span>
                    <small>{{ $t('gestaoArquivoModoCartoesDica') }}</small>
                </button>
            </div>

            <div class="gm-grade">
                <label class="g-marcar">
                    <input id="printBackground" type="checkbox" v-model="options.printBackground"/>
                    <span>{{ $t('gestaoArquivoCorDeFundo') }}<small class="g-dica ar-sub">{{ $t('gestaoArquivoCorDeFundoDica') }}</small></span>
                </label>
                <template v-if="pdfExportMode === pdfService.MODE_NORMAL">
                    <label class="g-marcar">
                        <input id="showLinks" type="checkbox" v-model="options.showLinks"/>
                        <span>{{ $t('gestaoArquivoLigarPaginas') }}<small class="g-dica ar-sub">{{ $t('gestaoArquivoLigarPaginasDica') }}</small></span>
                    </label>
                    <label class="g-marcar">
                        <input id="includeGlobalGrid" type="checkbox" v-model="options.includeGlobalGrid"/>
                        <span>{{ $t('gestaoArquivoComBarraFixa') }}<small class="g-dica ar-sub">{{ $t('gestaoArquivoComBarraFixaDica') }}</small></span>
                    </label>
                </template>
            </div>

            <template v-if="pdfExportMode === pdfService.MODE_RESIZE">
                <div class="g-campo">
                    <label for="selectedSize">{{ $t('gestaoArquivoTamanhoCartao') }}</label>
                    <select id="selectedSize" v-model="selectedSize">
                        <option v-for="option in sizeOptions" :value="option" :key="option.elemSize">
                            {{ formatOption(option) }}
                        </option>
                        <option :value="null">{{ $t('gestaoArquivoOutroTamanho') }}</option>
                    </select>
                    <span class="g-dica">{{ $t('gestaoArquivoTamanhoCartaoDica') }}</span>
                </div>
                <div class="ar-slider" v-if="selectedSize === null">
                    <slider-input id="customElemSize" v-model="customSize" :min="10" :max="192" :label="$t('gestaoArquivoOutroTamanho')" unit="mm" :value-format-fn="formatCustomSizeValue"/>
                </div>
            </template>
        </section>

        <details class="gm-avancado" v-if="pdfExportMode === pdfService.MODE_NORMAL">
            <summary>{{ $t('gestaoArquivoAvancado') }}</summary>
            <div class="gm-avancado-corpo">
                <label class="g-marcar">
                    <input id="showRegister" type="checkbox" v-model="options.showRegister"/>
                    <span>{{ $t('gestaoArquivoIndiceNaBorda') }}<small class="g-dica ar-sub">{{ $t('gestaoArquivoIndiceNaBordaDica') }}</small></span>
                </label>
            </div>
        </details>

        <template #rodape>
            <button type="button" class="g-btn" @click="$emit('close')" :title="$t('keyboardEsc')">{{ $t('gestaoCancelar') }}</button>
            <button type="button" class="g-btn g-btn-principal" @click="save()" :title="$t('keyboardCtrlEnter')">
                <i class="ti ti-file-download" aria-hidden="true"></i>{{ $t('gestaoArquivoCriarPdf') }}
            </button>
        </template>
    </gestao-modal>
</template>

<script>
    import {i18nService} from "../../js/service/i18nService";
    import GestaoModal from './gestaoModal.vue';
    import {dataService} from "../../js/service/data/dataService";
    import {gridUtil} from "../../js/util/gridUtil";
    import {pdfService} from "../../js/service/pdfExport/pdfService";
    import {MainVue} from "../../js/vue/mainVue";
    import {util} from "../../js/util/util";
    import SliderInput from "./input/sliderInput.vue";

    export default {
        components: {SliderInput, GestaoModal},
        props: ['gridsData', 'printGridId', 'metadata'],
        data: function () {
            let sizeOptions = pdfService.getSizeOptions();
            return {
                pdfExportMode: pdfService.MODE_NORMAL,
                selectedGrid: null,
                globalGridId: null,
                graphList: [],
                allChildren: null,
                options: {
                    exportConnected: true,
                    printBackground: false,
                    showLinks: true,
                    showRegister: false,
                    includeGlobalGrid: true
                },
                sizeOptions: sizeOptions,
                selectedSize: sizeOptions[0],
                customSize: 64,
                pdfService: pdfService,
                util: util
            }
        },
        methods: {
            async save() {
                let exportGrids = null;
                let grids = [];
                if (!this.selectedGrid) {
                    exportGrids = this.graphList.map(elem => elem.grid);
                } else {
                    exportGrids = this.options.exportConnected ? [this.selectedGrid].concat(this.allChildren) : [this.selectedGrid];
                }
                let exportIds = exportGrids.map(grid => grid.id);
                if (exportGrids.length > this.gridsData.length / 2) {
                    grids = await dataService.getGrids(true, true);
                } else {
                    for (let i = 0; i < exportIds.length; i++) {
                        let fullGrid = await dataService.getGrid(exportIds[i]);
                        grids.push(fullGrid);
                    }
                }
                grids = exportIds.map(id => grids.find(grid => grid.id === id));
                let progressFn = (progress, text, abortFn) => {
                    MainVue.showProgressBar(progress, {
                        header: i18nService.t('gestaoArquivoCriandoPdf'),
                        text: text,
                        cancelFn: abortFn,
                        closable: true
                    })
                };
                if (this.pdfExportMode === pdfService.MODE_NORMAL) {
                    let homeGridId = this.metadata.homeGridId;
                    let selectedId = this.selectedGrid ? this.selectedGrid.id : null;
                    grids = gridUtil.sortGrids(grids, homeGridId, selectedId);
                    pdfService.gridsToPdf(grids, {
                        printBackground: this.options.printBackground,
                        showLinks: this.options.showLinks,
                        showRegister: this.options.showRegister,
                        includeGlobalGrid: this.options.includeGlobalGrid,
                        progressFn: progressFn
                    });
                } else if (this.pdfExportMode === pdfService.MODE_RESIZE) {
                    let elemSize = this.selectedSize ? this.selectedSize.elemSize : this.customSize;
                    pdfService.gridsResizedToPdf(grids, elemSize, {
                        printBackground: this.options.printBackground,
                        progressFn: progressFn
                    });
                }
                this.$emit('close');
            },
            selectedGridChanged() {
                if (!this.selectedGrid) {
                    return;
                }
                this.allChildren = gridUtil.getAllChildrenRecursive(this.graphList, this.selectedGrid.id);
            },
            formatCustomSizeValue(value) {
                let option = pdfService.getSizeOption(value);
                return this.formatOption(option);
            },
            formatOption(option) {
                return `${util.roundTo(option.elemSize, 1)}mm (${option.itemsX} x ${option.itemsY})`;
            }
        },
        mounted() {
            dataService.getGlobalGrid().then(globalGrid => {
                this.globalGridId = globalGrid ? globalGrid.id : null;
                this.graphList = gridUtil.getGraphList(this.gridsData, this.globalGridId);
                if (this.printGridId) {
                    this.selectedGrid = this.gridsData.filter(grid => grid.id === this.printGridId)[0];
                    this.options.exportConnected = false;
                    this.options.showLinks = false;
                    this.selectedGridChanged();
                }
            });
        }
    }
</script>

<style scoped>
    .ar-escolha-prancha { display: flex; align-items: flex-start; gap: var(--g-e4); flex-wrap: wrap; }
    .ar-escolha-campo { flex: 1 1 240px; min-width: 0; }
    .ar-miniatura {
        flex: none; width: 128px; aspect-ratio: 4 / 3; border-radius: var(--g-raio);
        border: 2px solid var(--g-borda); background: var(--g-superficie-2); overflow: hidden;
        display: grid; place-items: center; color: var(--g-tinta-3);
    }
    .ar-miniatura img { width: 100%; height: 100%; object-fit: contain; background: #fff; display: block; }
    .ar-miniatura .ti { font-size: 40px; }
    .ar-sub { display: block; font-weight: 400; }
    .ar-modos { grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); }

    /* entorno do sliderInput (componente compartilhado com Ajustes: não mudamos o arquivo dele, só arrumamos aqui) */
    .ar-slider { margin-bottom: var(--g-e4); }
    .ar-slider ::v-deep > div {
        display: flex; flex-wrap: wrap; align-items: center; gap: var(--g-e1) var(--g-e3);
    }
    .ar-slider ::v-deep > div > label {
        flex: 1 1 100%; width: auto; float: none; margin: 0; font-weight: 700;
    }
    .ar-slider ::v-deep > div > input[type="range"] {
        flex: 1 1 200px; width: auto; float: none; margin: 0;
        min-height: var(--g-alvo); accent-color: var(--g-folha);
    }
    .ar-slider ::v-deep > div > div {
        flex: 0 1 auto; width: auto; float: none; margin: 0;
        color: var(--g-tinta-2); font-size: var(--g-t-legenda);
    }
    .ar-slider ::v-deep > div > button {
        width: auto; float: none; margin: 0;
    }

    @media (max-width: 600px) {
        .ar-miniatura { display: none; }
    }
</style>
