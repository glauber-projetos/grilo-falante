<template>
    <gestao-modal :titulo="$t('gestaoArquivoGuardarTitulo')" :subtitulo="$t('gestaoArquivoGuardarSubtitulo')" icone="device-floppy"
                  @close="$emit('close')" @keydown.ctrl.enter.native="save()">
        <template #cabeca>
            <button type="button" class="g-btn g-btn-leve g-btn-icone" @click="openHelp()" :aria-label="$t('gestaoArquivoAjuda')" :title="$t('gestaoArquivoAjuda')">
                <i class="ti ti-help-circle" aria-hidden="true"></i>
            </button>
        </template>

        <section class="gm-secao">
            <h3><i class="ti ti-layout-grid" aria-hidden="true"></i>{{ $t('gestaoArquivoQuaisPranchas') }}</h3>
            <div class="ar-escolha-prancha">
                <div class="g-campo ar-escolha-campo">
                    <label for="selectGrid">{{ $t('gestaoArquivoPrancha') }}</label>
                    <select id="selectGrid" v-model="selectedGrid" @change="selectedGridChanged">
                        <option :value="null">{{ $t('gestaoArquivoTodasAsPranchas', [graphList.length]) }}</option>
                        <option v-for="elem in graphList" :value="elem.grid" :key="elem.grid.id">{{elem.grid.label | extractTranslation}}</option>
                    </select>
                    <span class="g-dica" v-if="!selectedGrid">{{ $t('gestaoArquivoTodasDica') }}</span>
                </div>
                <span class="ar-miniatura" aria-hidden="true">
                    <img v-if="selectedGrid && selectedGrid.thumbnail && selectedGrid.thumbnail.data" :src="selectedGrid.thumbnail.data" alt=""/>
                    <i v-else :class="selectedGrid ? 'ti ti-layout-grid' : 'ti ti-stack-2'"></i>
                </span>
            </div>
            <label class="g-marcar" v-show="selectedGrid && allChildren && allChildren.length > 0">
                <input id="exportConnected" type="checkbox" v-model="options.exportConnected"/>
                <span>{{ $t('gestaoArquivoLevarJunto', [allChildren ? allChildren.length : 0]) }}<small class="g-dica ar-sub">{{ $t('gestaoArquivoLevarJuntoDica') }}</small></span>
            </label>
            <p class="g-dica ar-fotos"><i class="ti ti-photo-check" aria-hidden="true"></i>{{ $t('gestaoArquivoFotosVaoJunto') }}</p>
        </section>

        <section class="gm-secao">
            <h3><i class="ti ti-list-check" aria-hidden="true"></i>{{ $t('gestaoArquivoOQueMais') }}</h3>
            <label class="g-marcar">
                <input id="exportDictionaries" type="checkbox" v-model="options.exportDictionaries"/>
                <span>{{ $t('gestaoArquivoIncluirPalavras') }}<small class="g-dica ar-sub">{{ $t('gestaoArquivoIncluirPalavrasDica') }}</small></span>
            </label>
            <label class="g-marcar">
                <input id="exportUserSettings" type="checkbox" v-model="options.exportUserSettings"/>
                <span>{{ $t('gestaoArquivoIncluirAjustes') }}<small class="g-dica ar-sub">{{ $t('gestaoArquivoIncluirAjustesDica') }}</small></span>
            </label>
            <label class="g-marcar">
                <input id="exportGlobalGrid" type="checkbox" v-model="options.exportGlobalGrid"/>
                <span>{{ $t('gestaoArquivoIncluirBarraFixa') }}<small class="g-dica ar-sub">{{ $t('gestaoArquivoIncluirBarraFixaDica') }}</small></span>
            </label>
        </section>

        <details class="gm-avancado">
            <summary>{{ $t('gestaoArquivoAvancado') }}</summary>
            <div class="gm-avancado-corpo">
                <div class="g-campo">
                    <label for="selectExportLang">{{ $t('gestaoArquivoIdiomas') }}</label>
                    <select id="selectExportLang" v-model="options.exportLang">
                        <option v-for="option in options.exportLangOptions" :value="option" :key="option">{{ option === constants.LANG_EXPORT_CURRENT ? $t('gestaoArquivoIdiomaAtual') : $t('gestaoArquivoIdiomasTodos') }}</option>
                    </select>
                    <span class="g-dica" v-if="options.exportLang === constants.LANG_EXPORT_CURRENT">{{ $t('currentLanguage', {contentLangReadable: i18nService.getContentLangReadable(), contentLangCode: i18nService.getContentLang()}) }}</span>
                    <span class="g-dica" v-if="options.exportLang === constants.LANG_EXPORT_ALL">
                        <span>{{ $t('gestaoArquivoIdiomasNasPranchas', [currentLanguages.length]) }} </span>
                        <span v-for="(lang, index) in currentLanguages" :key="lang" :title="i18nService.getLangReadable(lang)">{{lang + (index < currentLanguages.length -1 ? ', ' : '')}}</span>
                    </span>
                </div>
                <label class="g-marcar">
                    <input id="exportOBZ" type="checkbox" v-model="options.exportOBZ"/>
                    <span>{{ $t('gestaoArquivoFormatoObz') }}<small class="g-dica ar-sub">{{ $t('gestaoArquivoFormatoObzDica') }}</small></span>
                </label>
            </div>
        </details>

        <template #rodape>
            <button type="button" class="g-btn" @click="$emit('close')" :title="$t('keyboardEsc')">{{ $t('gestaoCancelar') }}</button>
            <button type="button" class="g-btn g-btn-principal" @click="save()" :title="$t('keyboardCtrlEnter')">
                <i class="ti ti-download" aria-hidden="true"></i>{{ $t('gestaoArquivoGuardarArquivo') }}
            </button>
        </template>
    </gestao-modal>
</template>

<script>
    import {dataService} from '../../js/service/data/dataService'
    import GestaoModal from './gestaoModal.vue';
    import {helpService} from "../../js/service/helpService";
    import {gridUtil} from "../../js/util/gridUtil.js";
    import {i18nService} from "../../js/service/i18nService.js";
    import {localStorageService} from "../../js/service/data/localStorageService.js";
    import {util} from "../../js/util/util.js";
    import { MainVue } from '../../js/vue/mainVue';

    let constants = {
        LANG_EXPORT_CURRENT: 'LANG_EXPORT_CURRENT',
        LANG_EXPORT_ALL: 'LANG_EXPORT_ALL'
    }


    export default {
        components: {GestaoModal},
        props: ['gridsData', 'exportOptions'],
        data: function () {
            return {
                selectedGrid: null,
                globalGridId: null,
                graphList: [],
                allChildren: null,
                options: {
                    exportConnected: true,
                    exportDictionaries: false,
                    exportUserSettings: false,
                    exportGlobalGrid: false,
                    exportOBZ: false,
                    exportLang: constants.LANG_EXPORT_ALL,
                    exportLangOptions: [constants.LANG_EXPORT_ALL, constants.LANG_EXPORT_CURRENT]
                },
                constants: constants,
                i18nService: i18nService
            }
        },
        computed: {
            currentLanguages: function () {
                let grids = this.selectedGrid ? [this.selectedGrid] : this.gridsData;
                let langs = [];
                for (let grid of grids) {
                    for (let element of grid.gridElements) {
                        langs = [...new Set(langs.concat(Object.keys(element.label)))];
                    }
                }
                return langs;
            }
        },
        methods: {
            selectedGridChanged() {
                if (!this.selectedGrid) {
                    return;
                }
                this.allChildren = gridUtil.getAllChildrenRecursive(this.graphList, this.selectedGrid.id);
            },
            save() {
                let gridIds = this.selectedGrid ? [this.selectedGrid.id] : this.gridsData.map(grid => grid.id);
                if (this.selectedGrid && this.options.exportConnected) {
                    gridIds = gridIds.concat(this.allChildren.map(grid => grid.id));
                }

                let user = localStorageService.getAutologinUser();
                let filename = null;
                if (gridIds.length === 1 && this.selectedGrid) {
                    filename = `${user}_${util.getCurrentDateTimeString()}_${i18nService.getTranslation(this.selectedGrid.label)}`;
                } else {
                    filename = `${user}_${util.getCurrentDateTimeString()}_grilo-falante-backup-personalizado`;
                }
                dataService.downloadToFile(gridIds, {
                    exportGlobalGrid: this.options.exportGlobalGrid,
                    exportOnlyCurrentLang: this.options.exportLang === constants.LANG_EXPORT_CURRENT,
                    exportDictionaries: this.options.exportDictionaries,
                    exportUserSettings: this.options.exportUserSettings,
                    filename: filename,
                    obzFormat: this.options.exportOBZ,
                    progressFn: (percent, text) => {
                        MainVue.showProgressBar(percent, {
                            header: i18nService.t('gestaoArquivoGuardandoCopia'),
                            text: text
                        });
                    }
                });
                this.$emit('close');
            },
            openHelp() {
                helpService.openHelp();
            }
        },
        mounted() {
            dataService.getGlobalGrid().then(globalGrid => {
                this.globalGridId = globalGrid ? globalGrid.id : null;
                this.graphList = gridUtil.getGraphList(this.gridsData, this.globalGridId, true);
                if (this.exportOptions.gridId) {
                    for (let elem of this.graphList) {
                        if (this.exportOptions.gridId === elem.grid.id) {
                            this.selectedGrid = elem.grid;
                            this.selectedGridChanged();
                        }
                    }
                }
                if (this.exportOptions) {
                    this.options = Object.assign(this.options, this.exportOptions);
                }
            });
        },
        beforeDestroy() {
            helpService.revertToLastLocation();
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
    .ar-fotos { display: flex; align-items: center; gap: var(--g-e2); margin: var(--g-e2) 0 0; }
    .ar-fotos .ti { font-size: 20px; color: var(--g-folha-escura); flex: none; }
    @media (max-width: 600px) {
        .ar-miniatura { display: none; }
    }
</style>
