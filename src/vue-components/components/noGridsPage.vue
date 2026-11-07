<template>
    <div class="np-tela">
        <section class="np-boas-vindas" aria-labelledby="npTitulo">
            <img class="np-mascote" src="app/img/grilo/mascote/grilo-duvida.webp" alt="" width="140" height="140"/>
            <div class="np-boas-vindas-texto">
                <h2 id="npTitulo">{{ $t('gestaoArquivoSemPranchasTitulo') }}</h2>
                <p class="g-apoio">{{ $t('gestaoArquivoSemPranchasTexto') }}</p>
            </div>
        </section>

        <div class="np-acoes">
            <a href="#configurar" class="np-acao np-acao-destaque">
                <span class="np-acao-icone" aria-hidden="true"><i class="ti ti-wand"></i></span>
                <span class="np-acao-texto">{{ $t('gestaoArquivoConfigGuiada') }}<small>{{ $t('wizardCardText') }}</small></span>
            </a>
            <button type="button" class="np-acao" @click="restoreBackupHandler()">
                <span class="np-acao-icone" aria-hidden="true"><i class="ti ti-folder-open"></i></span>
                <span class="np-acao-texto">{{ $t('gestaoAbrirCopia') }}<small>{{ $t('gestaoArquivoAbrirCopiaDica') }}</small></span>
            </button>
            <button type="button" class="np-acao" @click="importCustomHandler()">
                <span class="np-acao-icone" aria-hidden="true"><i class="ti ti-file-import"></i></span>
                <span class="np-acao-texto">{{ $t('gestaoTrazerPranchas') }}<small>{{ $t('gestaoArquivoJuntarDicaVazio') }}</small></span>
            </button>
        </div>

        <section class="np-prontas" aria-labelledby="npProntasTitulo">
            <h2 id="npProntasTitulo"><i class="ti ti-world-download" aria-hidden="true"></i>{{ $t('gestaoArquivoProntasTitulo') }}</h2>
            <p class="g-apoio">{{ $t('gestaoArquivoProntasTexto') }}</p>

            <div class="np-filtros">
                <div class="g-campo np-busca">
                    <label for="buscaProntas">{{ $t('gestaoArquivoProntasBuscar') }}</label>
                    <div class="np-busca-caixa">
                        <i class="ti ti-search" aria-hidden="true"></i>
                        <input id="buscaProntas" type="text" v-model="searchTerm" @input="search" :placeholder="$t('gestaoArquivoProntasBuscarDica')" autocomplete="off"/>
                    </div>
                </div>
                <details class="gm-avancado np-mais-filtros">
                    <summary>{{ $t('gestaoArquivoMaisFiltros') }}</summary>
                    <div class="gm-avancado-corpo np-grade">
                        <div class="g-campo">
                            <label for="npIdioma">{{ $t('language') }}</label>
                            <select id="npIdioma" v-model="searchOptions.lang" @change="search">
                                <option value="">{{ $t('gestaoArquivoTodosIdiomas') }}</option>
                                <option v-for="lang in selectLanguages" :value="lang.code" :key="lang.code">{{lang | extractTranslationAppLang}} ({{lang.code}})</option>
                            </select>
                        </div>
                        <div class="g-campo">
                            <label for="npTipo">{{ $t('gestaoArquivoTipo') }}</label>
                            <select id="npTipo" v-model="searchOptions.type" @change="search">
                                <option value="">{{ $t('gestaoArquivoTodosTipos') }}</option>
                                <option :value="constants.BOARD_TYPE_SELFCONTAINED">{{ $t(constants.BOARD_TYPE_SELFCONTAINED) }}</option>
                                <option :value="constants.BOARD_TYPE_SINGLE">{{ $t(constants.BOARD_TYPE_SINGLE) }}</option>
                            </select>
                        </div>
                    </div>
                </details>
            </div>

            <ul v-if="gridPreviews && gridPreviews.length > 0" class="np-cartoes">
                <li v-for="(preview, index) in gridPreviews" :key="preview.filename || index" class="np-cartao">
                    <span class="np-miniatura" aria-hidden="true">
                        <img v-if="preview.thumbnail" :src="preview.thumbnail" alt="" loading="lazy"/>
                        <i v-else class="ti ti-layout-grid"></i>
                    </span>
                    <div class="np-cartao-corpo">
                        <h3 class="np-cartao-nome">{{ preview.name | extractTranslation }}</h3>
                        <ul class="np-etiquetas" :aria-label="$t('tags')">
                            <li class="g-pilula g-pilula-ok"><i class="ti ti-language" aria-hidden="true"></i>{{ preview.languages.length === 1 ? $t(`lang.${preview.languages[0]}`) : $t('gestaoArquivoVariosIdiomas') }}</li>
                            <li class="g-pilula" v-for="tag in preview.tags" :key="tag">{{ tag }}</li>
                        </ul>
                    </div>
                    <div class="np-cartao-botoes">
                        <button type="button" class="g-btn" @click="detailPreview = preview" :aria-label="$t('gestaoArquivoVerDetalhesDe', [nomeDe(preview)])">
                            <i class="ti ti-info-circle" aria-hidden="true"></i>{{ $t('gestaoArquivoVerDetalhes') }}
                        </button>
                        <button type="button" class="g-btn g-btn-principal" @click="importData(preview)" :disabled="loading" :aria-label="$t('gestaoArquivoUsarEstaDe', [nomeDe(preview)])">
                            <i class="ti ti-check" aria-hidden="true"></i>{{ $t('gestaoArquivoUsarEsta') }}
                        </button>
                    </div>
                </li>
            </ul>
            <p v-else class="gm-vazio np-nada"><img src="app/img/grilo/mascote/grilo-duvida.webp" alt="" width="96" height="96"/>{{ $t('gestaoArquivoProntasNenhuma') }}</p>
        </section>

        <config-preview-detail v-if="detailPreview" :preview="detailPreview" @close="detailPreview = null" @import="importData(detailPreview)"></config-preview-detail>
    </div>
</template>

<script>
    import {dataService} from "../../js/service/data/dataService.js";
    import {Router} from "../../js/router.js";
    import {i18nService} from "../../js/service/i18nService.js";
    import {constants} from '../../js/util/constants';
    import { urlParamService } from '../../js/service/urlParamService';
    import { util } from '../../js/util/util';
    import {boardService} from '../../js/service/boards/boardService';
    import { MainVue } from '../../js/vue/mainVue';
    import ConfigPreviewDetail from '../modals/configPreviewDetail.vue';

    export default {
        components: { ConfigPreviewDetail },
        props: ["restoreBackupHandler", "importCustomHandler", "resetGlobalGrid"],
        data() {
            return {
                gridPreviews: [],
                selectedGridset: null,
                loading: false,
                i18nService: i18nService,
                linkCopied: false,
                searchTerm: '',
                searchOptions: {
                    lang: "",
                    type: constants.BOARD_TYPE_SELFCONTAINED
                },
                allLanguages: i18nService.getAllLanguages(),
                selectLanguages: [],
                constants: constants,
                detailPreview: null
            }
        },
        methods: {
            nomeDe(preview) {
                return i18nService.getTranslation(preview.name);
            },
            search() {
                util.debounce(async () => {
                    this.gridPreviews = await boardService.query(this.searchTerm, this.searchOptions);
                }, 300, "SEARCH_BOARDS");
            },
            importData(preview) {
                let thiz = this;
                this.loading = true;
                dataService.importBackupFromPreview(preview, {
                    progressFn: (percent, text) => {
                        MainVue.showProgressBar(percent, {
                            header: i18nService.t('importingData'),
                            text: text
                        });
                    }
                }).then(async () => {
                    thiz.loading = false;
                    if (preview.translate) { // currently empty config is the only one with .translate prop
                        Router.toEditGrid();
                    } else {
                        Router.toMain();
                    }
                });
            }
        },
        async mounted() {
            let thiz = this;
            thiz.gridPreviews = await boardService.query();
            thiz.selectLanguages = this.allLanguages.filter(lang => this.gridPreviews.some(preview => preview.languages.includes(lang.code)));
            thiz.searchOptions.lang = thiz.selectLanguages.map(e => e.code).includes(i18nService.getAppLang()) ? i18nService.getAppLang() : "";
            thiz.gridPreviews = await boardService.query("", thiz.searchOptions);
        },
        beforeDestroy() {
        }
    }
</script>

<style scoped>
    .np-tela { padding-bottom: var(--g-e6); }

    /* boas-vindas com o mascote */
    .np-boas-vindas {
        display: flex; align-items: center; gap: var(--g-e5);
        padding: var(--g-e5); margin-bottom: var(--g-e4);
        background: var(--g-girassol-claro); border-radius: var(--g-raio-g);
    }
    .np-mascote { width: 140px; height: 140px; object-fit: contain; flex: none; }
    .np-boas-vindas-texto { min-width: 0; }
    .np-boas-vindas h2 { font-size: var(--g-t-h1); margin: 0 0 var(--g-e2); }
    .np-boas-vindas p { margin: 0; font-size: var(--g-t-grande); }

    /* três ações grandes */
    .np-acoes { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: var(--g-e3); margin-bottom: var(--g-e6); }
    .np-acao {
        display: flex; align-items: flex-start; gap: var(--g-e3); text-align: left;
        min-height: 104px; height: auto; margin: 0; padding: var(--g-e4);
        background: var(--g-superficie); border: 2px solid var(--g-borda); border-radius: var(--g-raio-g);
        font-family: var(--g-fonte); font-size: var(--g-t-grande); font-weight: 700; color: var(--g-tinta);
        text-transform: none; letter-spacing: 0; line-height: 1.25; white-space: normal; cursor: pointer;
        text-decoration: none;
        transition: transform var(--g-rapido) var(--g-curva), border-color var(--g-rapido);
    }
    .np-acao:hover { border-color: var(--g-borda-forte); color: var(--g-tinta); }
    .np-acao:active { transform: scale(0.98); }
    .np-acao:focus-visible { outline: none; box-shadow: var(--g-foco); }
    .np-acao-icone {
        width: 48px; height: 48px; flex: none; border-radius: var(--g-raio);
        display: grid; place-items: center; font-size: 28px;
        background: var(--g-folha-clara); color: var(--g-folha-escura);
    }
    .np-acao-texto { min-width: 0; }
    .np-acao small { display: block; font-weight: 400; font-size: var(--g-t-legenda); color: var(--g-tinta-2); margin-top: 4px; }
    .np-acao-destaque { background: var(--g-folha); border-color: var(--g-folha); color: #fff; }
    .np-acao-destaque:hover { background: var(--g-folha-escura); border-color: var(--g-folha-escura); color: #fff; }
    .np-acao-destaque small { color: #fff; opacity: 0.92; }
    .np-acao-destaque .np-acao-icone { background: rgba(255, 255, 255, 0.2); color: #fff; }

    /* pranchas prontas */
    .np-prontas h2 { display: flex; align-items: center; gap: var(--g-e2); font-size: var(--g-t-h2); }
    .np-prontas h2 .ti { color: var(--g-folha-escura); }
    .np-prontas > p { margin: 0 0 var(--g-e4); }
    .np-filtros { margin-bottom: var(--g-e4); }
    .np-busca { margin-bottom: var(--g-e2); }
    .np-busca-caixa { position: relative; display: flex; align-items: center; }
    .np-busca-caixa > .ti { position: absolute; left: 14px; font-size: 20px; color: var(--g-tinta-3); pointer-events: none; }
    .g-campo .np-busca-caixa input[type="text"] { padding-left: 44px; }
    .np-mais-filtros { margin: 0; }
    .np-grade { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 0 var(--g-e4); }

    .np-nada img { display: block; width: 96px; height: 96px; object-fit: contain; margin: 0 auto var(--g-e2); }
    .np-cartoes {
        list-style: none; margin: 0; padding: 0;
        display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: var(--g-e4);
    }
    .np-cartao {
        margin: 0; display: flex; flex-direction: column;
        background: var(--g-superficie); border: 2px solid var(--g-borda); border-radius: var(--g-raio-g);
        overflow: hidden;
    }
    .np-miniatura {
        display: grid; place-items: center; width: 100%; aspect-ratio: 16 / 9;
        background: var(--g-superficie-2); color: var(--g-tinta-3); overflow: hidden;
    }
    .np-miniatura img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .np-miniatura .ti { font-size: 48px; }
    .np-cartao-corpo { flex: 1; padding: var(--g-e3) var(--g-e4) 0; }
    .np-cartao .np-cartao-nome { font-size: var(--g-t-grande); margin: 0 0 var(--g-e2); overflow-wrap: anywhere; }
    .np-etiquetas { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: var(--g-e1); }
    .np-etiquetas li { margin: 0; min-height: 28px; }
    .np-cartao-botoes { display: flex; flex-wrap: wrap; gap: var(--g-e2); padding: var(--g-e3) var(--g-e4) var(--g-e4); }
    .np-cartao-botoes .g-btn { flex: 1 1 120px; padding: 0 var(--g-e3); }

    @media (max-width: 600px) {
        .np-boas-vindas { flex-direction: column; text-align: center; padding: var(--g-e4); gap: var(--g-e3); }
        .np-mascote { width: 112px; height: 112px; }
        .np-boas-vindas h2 { font-size: var(--g-t-h2); }
    }
</style>
