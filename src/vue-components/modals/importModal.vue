<template>
    <gestao-modal :titulo="$t('gestaoArquivoJuntarTitulo')" :subtitulo="$t('gestaoArquivoJuntarSubtitulo')" icone="file-import"
                  @close="$emit('close')" @keydown.ctrl.enter.native="save()">
        <template #cabeca>
            <button type="button" class="g-btn g-btn-leve g-btn-icone" @click="openHelp()" :aria-label="$t('gestaoArquivoAjuda')" :title="$t('gestaoArquivoAjuda')">
                <i class="ti ti-help-circle" aria-hidden="true"></i>
            </button>
        </template>

        <section class="gm-secao">
            <h3><i class="ti ti-file-search" aria-hidden="true"></i>{{ $t('gestaoArquivoEscolherArquivo') }}</h3>
            <label class="ar-arquivo" for="fileInput" :class="{'ar-arquivo-pronto': !!importData}">
                <input id="fileInput" class="g-oculto-leitor" type="file" @change="fileChanged" accept=".grd, .txt"/>
                <i :class="importData ? 'ti ti-file-check' : 'ti ti-file-upload'" aria-hidden="true"></i>
                <span class="ar-arquivo-texto">
                    <strong>{{ file ? file.name : $t('gestaoArquivoTocarParaEscolher') }}</strong>
                    <small>{{ file ? $t('gestaoArquivoTrocarArquivo') : $t('gestaoArquivoTiposAceitos') }}</small>
                </span>
            </label>

            <div class="g-aviso ar-aviso" v-if="file && !importData" role="alert">
                <i class="ti ti-alert-triangle" aria-hidden="true"></i>
                <span>{{ $t('gestaoArquivoSemPranchas') }}</span>
            </div>

            <div v-if="importData" class="ar-resumo">
                <p class="ar-resumo-titulo">{{ $t('gestaoArquivoNoArquivo') }}</p>
                <ul class="ar-pilulas">
                    <li v-if="hasGrids" class="g-pilula g-pilula-ok" :title="importData.grids.map(g => i18nService.getTranslation(g.label)).join(', ')">
                        <i class="ti ti-layout-grid" aria-hidden="true"></i>{{ $t('gestaoArquivoNPranchas', [importData.grids.length]) }}
                    </li>
                    <li v-if="hasDictionaries" class="g-pilula" :title="importData.dictionaries.map(d => d.dictionaryKey).join(', ')">
                        <i class="ti ti-abc" aria-hidden="true"></i>{{ $t('gestaoArquivoNListas', [importData.dictionaries.length]) }}
                    </li>
                    <li v-if="hasUserSettings" class="g-pilula">
                        <i class="ti ti-adjustments" aria-hidden="true"></i>{{ $t('gestaoArquivoAjustes') }}
                    </li>
                </ul>
            </div>
        </section>

        <section class="gm-secao" v-if="importData && (hasDictionaries || hasUserSettings || !hasGlobalGrid)">
            <h3><i class="ti ti-list-check" aria-hidden="true"></i>{{ $t('gestaoArquivoOQueTrazer') }}</h3>
            <label class="g-marcar" v-if="hasDictionaries">
                <input id="importDictionaries" type="checkbox" v-model="options.importDictionaries"/>
                <span>{{ $t('gestaoArquivoTrazerPalavras') }}<small class="g-dica ar-sub">{{ $t('gestaoArquivoIncluirPalavrasDica') }}</small></span>
            </label>
            <label class="g-marcar" v-if="hasUserSettings">
                <input id="importUserSettings" type="checkbox" v-model="options.importUserSettings"/>
                <span>{{ $t('gestaoArquivoTrazerAjustes') }}<small class="g-dica ar-sub">{{ $t('gestaoArquivoTrazerAjustesDica') }}</small></span>
            </label>
            <label class="g-marcar" v-if="!hasGlobalGrid">
                <input id="generateGlobalGrid" type="checkbox" v-model="options.generateGlobalGrid"/>
                <span>{{ $t('gestaoArquivoCriarBarraFixa') }}<small class="g-dica ar-sub">{{ $t('gestaoArquivoIncluirBarraFixaDica') }}</small></span>
            </label>
        </section>

        <details class="gm-avancado">
            <summary>{{ $t('gestaoArquivoAvancado') }}</summary>
            <div class="gm-avancado-corpo">
                <label class="g-marcar ar-perigo">
                    <input id="resetBeforeImport" type="checkbox" v-model="options.resetBeforeImport"/>
                    <span>{{ $t('gestaoArquivoApagarAntes') }}<small class="g-dica ar-sub">{{ $t('gestaoArquivoApagarAntesDica') }}</small></span>
                </label>
            </div>
        </details>

        <template #rodape>
            <button type="button" class="g-btn" @click="$emit('close')" :title="$t('keyboardEsc')">{{ $t('gestaoCancelar') }}</button>
            <button type="button" class="g-btn g-btn-principal" @click="save()" :disabled="!importData" :title="$t('keyboardCtrlEnter')">
                <i class="ti ti-file-import" aria-hidden="true"></i>{{ $t('gestaoArquivoJuntarBotao') }}
            </button>
        </template>
    </gestao-modal>
</template>

<script>
    import {dataService} from '../../js/service/data/dataService'
    import GestaoModal from './gestaoModal.vue';
    import {helpService} from "../../js/service/helpService";
    import {i18nService} from "../../js/service/i18nService.js";
    import {MainVue} from "../../js/vue/mainVue.js";
    import {messageUtil} from "../../js/util/messageUtil.js";
    import {constants} from "../../js/util/constants";


    export default {
        components: {GestaoModal},
        props: ['gridsData', 'reloadFn'],
        data: function () {
            return {
                data: null,
                file: null,
                importData: null,
                options: {
                    importDictionaries: true,
                    importUserSettings: true,
                    generateGlobalGrid: false,
                    resetBeforeImport: false
                },
                i18nService: i18nService
            }
        },
        computed: {
            hasGrids() {
                return this.importData && this.importData.grids && this.importData.grids.length > 0;
            },
            hasDictionaries() {
                return this.importData && this.importData.dictionaries && this.importData.dictionaries.length > 0;
            },
            hasUserSettings() {
                return this.importData && this.importData.metadata && this.importData.metadata.inputConfig;
            },
            hasGlobalGrid() {
                return this.hasGrids && this.importData.metadata && this.importData.metadata.globalGridId && this.importData.grids.map(g => g.id).includes(this.importData.metadata.globalGridId);
            }
        },
        methods: {
            async fileChanged(event) {
                this.file = event.target.files[0];
                this.importData = null;
                if (this.file) {
                    this.importData = await dataService.convertFileToImportData(this.file);
                }
            },
            async save() {
                if (!this.importData || (this.options.resetBeforeImport && !(await this.confirmarApagarAntes()))) {
                    return;
                }
                this.$emit('close');
                if (this.options.resetBeforeImport) {
                    MainVue.showProgressBar(0, {
                        header: i18nService.t('gestaoArquivoJuntandoPranchas'),
                        text: i18nService.t('gestaoArquivoApagandoPranchas')
                    });
                    await dataService.resetUserData();
                }
                MainVue.showProgressBar(20, {
                    header: i18nService.t('gestaoArquivoJuntandoPranchas'),
                    text: i18nService.t('gestaoArquivoTrazendoPranchas')
                });
                await dataService.importData(this.importData, {
                    importDictionaries: this.options.importDictionaries,
                    importUserSettings: this.options.importUserSettings,
                    generateGlobalGrid: this.options.generateGlobalGrid,
                    resetBeforeImport: this.options.resetBeforeImport,
                    progressFn: p => {
                        MainVue.showProgressBar(20 + Math.round(p / 100 * 80), {
                            header: i18nService.t('gestaoArquivoJuntandoPranchas'),
                            text: i18nService.t('gestaoArquivoTrazendoPranchas')
                        });
                    }
                });
                if (this.options.resetBeforeImport) {
                    await dataService.markCurrentConfigAsBackedUp();
                }

                // Show success message and reload on close
                await messageUtil.showImportSuccess(this.importData, () => {
                    if (this.reloadFn) {
                        this.reloadFn();
                    }
                });
            },
            confirmarApagarAntes() {
                // Grilo Falante: confirmação na mensagem do app (antes era o confirm() do navegador)
                return MainVue.showMessageBox({
                    type: constants.MODAL_TYPE_WARNING,
                    header: 'gestaoArquivoApagarAntesTitulo',
                    message: i18nService.t('gestaoArquivoApagarAntesTexto'),
                    buttons: [
                        {label: 'gestaoCancelar', value: false, icon: 'ti ti-x'},
                        {label: 'gestaoArquivoSimApagarEJuntar', value: true, icon: 'ti ti-trash'}
                    ]
                }).then(resposta => resposta === true);
            },
            openHelp() {
                helpService.openHelp();
            }
        },
        mounted() {
        },
        beforeDestroy() {
            helpService.revertToLastLocation();
        }
    }
</script>

<style scoped>
    .ar-arquivo {
        display: flex; align-items: center; gap: var(--g-e4);
        min-height: 88px; padding: var(--g-e4); margin: 0;
        border: 2px dashed var(--g-borda-forte); border-radius: var(--g-raio-g);
        background: var(--g-superficie-2); cursor: pointer;
        font-weight: 400;
    }
    .ar-arquivo:hover { border-color: var(--g-folha); }
    .ar-arquivo:focus-within { box-shadow: var(--g-foco); }
    .ar-arquivo > .ti { font-size: 36px; color: var(--g-folha-escura); flex: none; }
    .ar-arquivo-pronto { border-style: solid; border-color: var(--g-folha); background: var(--g-folha-clara); }
    .ar-arquivo-texto { display: flex; flex-direction: column; min-width: 0; }
    .ar-arquivo-texto strong { font-size: var(--g-t-grande); overflow-wrap: anywhere; }
    .ar-arquivo-texto small { color: var(--g-tinta-2); font-size: var(--g-t-legenda); }
    .ar-aviso { margin-top: var(--g-e3); }
    .ar-resumo { margin-top: var(--g-e4); }
    .ar-resumo-titulo { margin: 0 0 var(--g-e2); font-weight: 700; }
    .ar-pilulas { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: var(--g-e2); }
    .ar-pilulas li { margin: 0; }
    .ar-sub { display: block; font-weight: 400; }
    .ar-perigo > span { color: var(--g-perigo); }
</style>
