<template>
    <div class="g-tela pal-tela">
        <g-topo :titulo="$t('gestaoPalavrasTitulo')">
            <button type="button" class="g-btn pal-topo-btn" @click="showImportModal = true" :aria-label="$t('gestaoPalavrasTrazer')" :title="$t('gestaoPalavrasTrazer')">
                <i class="ti ti-file-import" aria-hidden="true"></i><span class="pal-topo-texto">{{ $t('gestaoPalavrasTrazerCurto') }}</span>
            </button>
            <button type="button" class="g-btn g-btn-principal pal-topo-btn" @click="addDictionary()" :disabled="!dicts" :aria-label="$t('gestaoPalavrasNovaLista')" :title="$t('gestaoPalavrasNovaLista')">
                <i class="ti ti-plus" aria-hidden="true"></i><span class="pal-topo-texto">{{ $t('gestaoPalavrasNovaLista') }}</span>
            </button>
        </g-topo>

        <main class="g-conteudo">
            <section class="pal-intro">
                <span class="pal-intro-icone" aria-hidden="true"><i class="ti ti-abc"></i></span>
                <div>
                    <p class="pal-intro-texto">{{ $t('gestaoPalavrasIntro') }}</p>
                    <p class="g-dica pal-intro-dica">{{ $t('gestaoPalavrasIntroDica') }}</p>
                </div>
            </section>

            <div v-if="!dicts" class="pal-carregando" role="status">
                <i class="ti ti-loader-2 pal-girar" aria-hidden="true"></i>
                <span>{{ $t('gestaoPalavrasCarregando') }}</span>
            </div>

            <template v-if="dicts && dicts.length > 0">
                <h2 class="pal-subtitulo">{{ $t('gestaoPalavrasSuasListas', [dicts.length]) }}</h2>
                <ul class="pal-lista">
                    <li v-for="dict in dicts" :key="dict.id" class="pal-cartao" :class="{'pal-cartao-aberto': editId === dict.id}">
                        <div class="pal-cartao-cabeca">
                            <span class="pal-cartao-icone" aria-hidden="true"><i class="ti ti-book-2"></i></span>

                            <div v-if="editModeId !== dict.id" class="pal-cartao-nome">
                                <h3>{{ dict.dictionaryKey }}</h3>
                                <span class="g-pilula" v-if="nomeIdioma(dict.lang)"><i class="ti ti-language" aria-hidden="true"></i>{{ nomeIdioma(dict.lang) }}</span>
                            </div>

                            <form v-if="editModeId === dict.id" class="pal-nome-form" @submit.prevent="!isLabelDuplicate(dict.dictionaryKey) && finishEditName(dict)" @keydown.esc.stop="cancelEditName()">
                                <div class="g-campo" :class="{'g-campo-erro': isLabelDuplicate(dict.dictionaryKey)}">
                                    <label :for="'nomeLista' + dict.id">{{ $t('gestaoPalavrasNomeDaLista') }}</label>
                                    <div class="gm-campo-linha">
                                        <input :id="'nomeLista' + dict.id" type="text" v-focus="" v-model="dict.dictionaryKey" autocomplete="off"/>
                                        <button type="button" class="g-btn g-btn-icone" v-if="originalLabel" @click="cancelEditName()" :aria-label="$t('gestaoCancelar')" :title="$t('gestaoCancelar')"><i class="ti ti-x" aria-hidden="true"></i></button>
                                        <button type="submit" class="g-btn g-btn-principal g-btn-icone" :disabled="isLabelDuplicate(dict.dictionaryKey)" :aria-label="$t('gestaoSalvar')" :title="$t('gestaoSalvar')"><i class="ti ti-check" aria-hidden="true"></i></button>
                                    </div>
                                    <span v-if="isLabelDuplicate(dict.dictionaryKey)" class="g-erro" role="alert">{{ $t('gestaoPalavrasNomeRepetido') }}</span>
                                </div>
                            </form>
                        </div>

                        <div class="pal-acoes">
                            <button type="button" class="g-btn" :class="{'g-btn-principal': editId === dict.id}" @click="edit(dict)" :aria-expanded="(editId === dict.id).toString()">
                                <i :class="editId === dict.id ? 'ti ti-chevron-up' : 'ti ti-pencil'" aria-hidden="true"></i>{{ editId === dict.id ? $t('gestaoPalavrasFechar') : $t('gestaoPalavrasAbrirEditar') }}
                            </button>
                            <button type="button" class="g-btn g-btn-leve" @click="enableEditName(dict)" v-if="editModeId !== dict.id">
                                <i class="ti ti-forms" aria-hidden="true"></i>{{ $t('gestaoMudarNome') }}
                            </button>
                            <button type="button" class="g-btn g-btn-leve" @click="clone(dict.id)">
                                <i class="ti ti-copy" aria-hidden="true"></i>{{ $t('gestaoDuplicar') }}
                            </button>
                            <button type="button" class="g-btn g-btn-leve" @click="downloadDict(dict.id, dict.dictionaryKey)">
                                <i class="ti ti-download" aria-hidden="true"></i>{{ $t('gestaoPalavrasGuardarArquivo') }}
                            </button>
                            <button type="button" class="g-btn g-btn-leve pal-apagar" @click="pedirApagar(dict)">
                                <i class="ti ti-trash" aria-hidden="true"></i>{{ $t('gestaoApagar') }}
                            </button>
                        </div>

                        <div class="pal-editar" v-if="editId === dict.id">
                            <div class="pal-editar-topo">
                                <div class="g-campo pal-idioma">
                                    <label :for="'idiomaLista' + dict.id">{{ $t('gestaoPalavrasIdioma') }}</label>
                                    <select :id="'idiomaLista' + dict.id" v-model="dict.lang">
                                        <option v-for="lang in languages" :value="lang.code" :key="lang.code">{{ lang | extractTranslationAppLang }}</option>
                                    </select>
                                </div>
                                <button type="button" class="g-btn g-btn-principal pal-acrescentar" @click="showWordsModal = true; modalDict = dict">
                                    <i class="ti ti-text-plus" aria-hidden="true"></i><span>{{ $t('gestaoPalavrasAcrescentar') }}</span>
                                </button>
                            </div>

                            <div class="pal-busca">
                                <p class="pal-busca-rotulo" aria-hidden="true">{{ $t('gestaoPalavrasProcurar') }}</p>
                                <search-bar v-model="searchWord" placeholder="gestaoPalavrasProcurarDica" label="gestaoPalavrasProcurar" @input="inputSearchWord()"></search-bar>
                            </div>

                            <p class="pal-contagem">{{ $t('gestaoPalavrasTotal', [totalWords]) }}</p>
                            <ul class="pal-palavras" v-if="wordlist.length > 0" :aria-label="$t('gestaoPalavrasLista')">
                                <li v-for="word in wordlist" :key="word" class="pal-palavra">
                                    <span>{{word}}</span>
                                    <button type="button" class="pal-palavra-x" @click="deleteWord(word, dict)" :aria-label="$t('gestaoPalavrasApagarPalavra', [word])" :title="$t('gestaoPalavrasApagarPalavra', [word])">
                                        <i class="ti ti-x" aria-hidden="true"></i>
                                    </button>
                                </li>
                            </ul>
                            <p class="g-dica" v-show="totalWords > wordlist.length && searchWord === ''">
                                {{ $t('gestaoPalavrasMaisPalavras', [totalWords - wordlist.length]) }}
                            </p>
                            <p class="g-dica" v-show="filterWords > wordlist.length && searchWord !== ''">
                                {{ $t('gestaoPalavrasMaisNaBusca', [filterWords - wordlist.length]) }}
                            </p>
                            <div class="g-aviso" v-show="searchWord && totalWords > 0 && wordlist.length === 0">
                                <i class="ti ti-mood-empty" aria-hidden="true"></i>
                                <div class="g-linha">
                                    <span>{{ $t('gestaoPalavrasNadaNaBusca') }}</span>
                                    <button type="button" class="g-btn" @click="inputSearchWord('')"><i class="ti ti-x" aria-hidden="true"></i><span>{{ $t('gestaoLimparBusca') }}</span></button>
                                </div>
                            </div>
                            <p class="gm-vazio" v-show="totalWords === 0"><i class="ti ti-abc" aria-hidden="true"></i>{{ $t('gestaoPalavrasListaVazia') }}</p>
                        </div>
                    </li>
                </ul>
            </template>

            <section v-if="dicts && dicts.length === 0" class="pal-vazio">
                <img src="app/img/grilo/mascote/grilo-duvida.webp" alt="" width="140" height="140"/>
                <h2>{{ $t('gestaoPalavrasNenhumaTitulo') }}</h2>
                <p class="g-apoio">{{ $t('gestaoPalavrasNenhumaTexto') }}</p>
                <div class="g-linha pal-vazio-botoes">
                    <button type="button" class="g-btn g-btn-principal g-btn-grande" @click="showImportModal = true"><i class="ti ti-file-import" aria-hidden="true"></i>{{ $t('gestaoPalavrasTrazer') }}</button>
                    <button type="button" class="g-btn g-btn-grande" @click="addDictionary()"><i class="ti ti-plus" aria-hidden="true"></i>{{ $t('gestaoPalavrasNovaLista') }}</button>
                </div>
            </section>
        </main>

        <import-words-modal v-if="showWordsModal" v-bind:dict-data="modalDict"
                            @close="showWordsModal = false" @reload="reload"/>
        <import-dictionary-modal v-if="showImportModal" :dicts="dicts"
                                 @close="showImportModal = false" @reload="reload"/>

        <gestao-modal v-if="apagarDict" tamanho="p" :titulo="$t('gestaoPalavrasApagarTitulo')" icone="trash" perigo @close="apagarDict = null">
            <p>{{ $t('gestaoPalavrasApagarTexto', [apagarDict.dictionaryKey]) }}</p>
            <template #rodape>
                <button type="button" class="g-btn" @click="apagarDict = null" autofocus>{{ $t('gestaoCancelar') }}</button>
                <button type="button" class="g-btn g-btn-perigo" @click="confirmarApagar()"><i class="ti ti-trash" aria-hidden="true"></i>{{ $t('gestaoApagarConfirmar') }}</button>
            </template>
        </gestao-modal>
    </div>
</template>

<script>
    import $ from '../../js/externals/jquery.js';
    import FileSaver from 'file-saver';
    import {dataService} from "../../js/service/data/dataService";
    import {modelUtil} from "../../js/util/modelUtil";
    import {i18nService} from "../../js/service/i18nService";
    import {predictionService} from "../../js/service/predictionService";
    import {constants} from "../../js/util/constants";
    import {util} from "../../js/util/util";
    import {Dictionary} from "../../js/model/Dictionary";
    import Predictionary from 'predictionary'
    import ImportWordsModal from '../modals/importWordsModal.vue'
    import ImportDictionaryModal from '../modals/importDictionaryModal.vue'
    import GTopo from '../components/gTopo.vue';
    import GestaoModal from '../modals/gestaoModal.vue';
    import {helpService} from "../../js/service/helpService";
    import SearchBar from '../components/searchBar.vue';

    let vueApp = null;
    let vueConfig = {
        data() {
            return {
                dicts: null,
                modalDict: null,
                editModeId: '',
                editId: null,
                originalLabel: '',
                showLoading: true,
                predictionary: null,
                wordlist: [],
                searchWord: "",
                showWordsModal: false,
                showImportModal: false,
                totalWords: 0,
                filterWords: 0,
                languages: i18nService.getAllLanguages(),
                apagarDict: null
            };
        },
        components: {
            SearchBar,
            ImportDictionaryModal, ImportWordsModal, GTopo, GestaoModal
        },
        methods: {
            // Grilo Falante: a confirmação agora é o modal "Apagar a lista?" (pedirApagar / confirmarApagar)
            deleteDict: function (id, label) {
                let thiz = this;
                dataService.deleteObject(id).then(() => {
                    thiz.reload();
                });
            },
            pedirApagar(dict) {
                this.apagarDict = dict;
            },
            confirmarApagar() {
                let dict = this.apagarDict;
                this.apagarDict = null;
                if (dict) {
                    if (this.editId === dict.id) {
                        this.editFinished();
                    }
                    this.deleteDict(dict.id, dict.dictionaryKey);
                }
            },
            nomeIdioma(code) {
                if (!code) {
                    return '';
                }
                let lang = this.languages.find(l => l.code === code);
                return lang ? i18nService.getTranslationAppLang(lang) : code;
            },
            downloadDict: function (id, label) {
                let blob = new Blob([this.dicts.filter(d => d.id === id)[0].data], {type: "application/json;charset=utf-8"});
                FileSaver.saveAs(blob, `dictionary-${label}.json`);
            },
            addDictionary: function () {
                log.debug('add dictionary!');
                let existingNames = this.dicts.map(dict => dict.dictionaryKey);
                let dictData = new Dictionary({
                    dictionaryKey: modelUtil.getNewName(i18nService.t('gestaoPalavrasNovaListaNome'), existingNames),
                    lang: i18nService.getContentLang()
                });
                dataService.saveDictionary(dictData).then(() => {
                    this.editModeId = dictData.id;
                    this.reload();
                });
            },
            finishEditName: function (dict) {
                dataService.saveDictionary(dict);
                this.editModeId = '';
                this.originalLabel = '';
            },
            enableEditName: function (dict) {
                this.cancelEditName();
                this.editModeId = dict.id;
                this.originalLabel = dict.dictionaryKey;
            },
            cancelEditName: function () {
                if (this.editModeId) {
                    let dict = this.dicts.filter(d => d.id === this.editModeId)[0];
                    dict.dictionaryKey = this.originalLabel || dict.dictionaryKey;
                }
                this.editModeId = '';
                this.originalLabel = '';
            },
            isLabelDuplicate: function (label) {
                return this.dicts.map(g => g.dictionaryKey).filter(l => l === label).length > 1
            },
            show(dictId) {
            },
            edit(dict) {
                this.cancelEditName();
                if (this.editId === dict.id) {
                    this.editFinished();
                    return;
                }
                this.editId = dict.id;
                this.predictionary = Predictionary.instance();
                this.predictionary.loadDictionary(dict.data);
                this.totalWords = this.predictionary.getWords().length;
                this.inputSearchWord('');
                helpService.setHelpLocation('07_dictionaries', '#edit-dictionaries');
            },
            editFinished() {
                this.editId = null;
                this.searchWord = "";
                helpService.setHelpLocation('02_navigation', '#manage-dictionaries-view');
            },
            inputSearchWord(input) {
                let thiz = this;
                let timeout = input === undefined ? 200 : 0;
                util.debounce(function () {
                    thiz.searchWord = input === undefined ? thiz.searchWord : input;
                    let suggestions = thiz.predictionary.predict(thiz.searchWord, {maxPredicitons: 10000});
                    thiz.filterWords = suggestions.length;
                    thiz.wordlist = suggestions.slice(0, 9);
                }, timeout, util.DEFAULT_KEY2);
            },
            clone(dictId) {
                let thiz = this;
                dataService.getDictionary(dictId).then(dict => {
                    dataService.saveDictionary(dict.clone()).then(() => {
                        thiz.reload();
                    });
                })
            },
            deleteWord(word, dict) {
                let thiz = this;
                thiz.predictionary.delete(word);
                this.totalWords = this.predictionary.getWords().length;
                util.debounce(function () {
                    dict.data = thiz.predictionary.dictionaryToJSON();
                    dataService.saveDictionary(dict);
                }, 2000, util.DEFAULT_KEY);
                thiz.inputSearchWord();
            },
            reload: function (dictData) {
                let thiz = this;
                dataService.getDictionaries().then(dicts => {
                    this.dicts = JSON.parse(JSON.stringify(dicts));
                    if (thiz.editId && dictData && dictData.data) {
                        thiz.editFinished();
                        thiz.edit(dictData);
                    }
                });
            },
            updatedHandler(event, updatedIds, updatedDocs) {
                if (updatedDocs[0].modelName === Dictionary.getModelName()) {
                    this.reload(updatedDocs[0]);
                }
            }
        },
        created() {
            let thiz = this;
            $(document).on(constants.EVENT_DB_PULL_UPDATED, thiz.updatedHandler);
            dataService.getDictionaries().then(dicts => {
                log.debug(dicts);
                thiz.dicts = JSON.parse(JSON.stringify(dicts)); //hack because otherwise vueJS databinding sometimes does not work;
                thiz.showLoading = false;
            });
        },
        mounted() {
            let thiz = this;
            vueApp = thiz;
        },
        beforeDestroy() {
            predictionService.init();
            $(document).off(constants.EVENT_DB_PULL_UPDATED, this.updatedHandler);
        }
    };

    export default vueConfig;
</script>

<style scoped>
    .pal-tela { height: 100%; overflow-y: auto; }

    .pal-intro {
        display: flex; align-items: flex-start; gap: var(--g-e4);
        padding: var(--g-e4) var(--g-e5); margin-bottom: var(--g-e5);
        background: var(--g-ceu); color: var(--g-ceu-escuro); border-radius: var(--g-raio-g);
    }
    .pal-intro-icone {
        width: 48px; height: 48px; flex: none; border-radius: 50%;
        display: grid; place-items: center; background: var(--g-superficie); font-size: 28px;
    }
    .pal-intro-texto { margin: 0; font-size: var(--g-t-grande); font-weight: 700; color: var(--g-ceu-escuro); }
    .pal-intro-dica { margin: var(--g-e1) 0 0; color: var(--g-ceu-escuro); }

    .pal-carregando { display: flex; flex-direction: column; align-items: center; gap: var(--g-e3); padding: var(--g-e6) 0; color: var(--g-tinta-2); }
    .pal-carregando .ti { font-size: 40px; color: var(--g-folha); }
    .pal-girar { animation: pal-giro 1s linear infinite; }
    @keyframes pal-giro { to { transform: rotate(360deg); } }
    @media (prefers-reduced-motion: reduce) { .pal-girar { animation: none; } }

    .pal-subtitulo { font-size: var(--g-t-h3); }
    .pal-lista { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: var(--g-e3); }
    .pal-cartao {
        margin: 0; padding: var(--g-e4);
        background: var(--g-superficie); border: 2px solid var(--g-borda); border-radius: var(--g-raio-g);
    }
    .pal-cartao-aberto { border-color: var(--g-folha); }
    .pal-cartao-cabeca { display: flex; align-items: flex-start; gap: var(--g-e3); }
    .pal-cartao-icone {
        width: 48px; height: 48px; flex: none; border-radius: var(--g-raio);
        display: grid; place-items: center; font-size: 26px;
        background: var(--g-folha-clara); color: var(--g-folha-escura);
    }
    .pal-cartao-nome { flex: 1; min-width: 0; display: flex; flex-wrap: wrap; align-items: center; gap: var(--g-e1) var(--g-e3); min-height: 48px; }
    .pal-cartao .pal-cartao-nome h3 { margin: 0; font-size: var(--g-t-h3); overflow-wrap: anywhere; }
    .pal-nome-form { flex: 1; min-width: 0; }
    .pal-nome-form .g-campo { margin: 0; }
    .gm-campo-linha { display: flex; gap: var(--g-e2); align-items: stretch; }
    .gm-campo-linha > input { flex: 1; min-width: 0; }

    .pal-acoes { display: flex; flex-wrap: wrap; gap: var(--g-e2); margin-top: var(--g-e3); padding-left: 60px; }
    .pal-acoes .g-btn { padding: 0 var(--g-e4); }
    .pal-acoes .pal-apagar { color: var(--g-perigo); }
    .pal-acoes .pal-apagar:hover { background: var(--g-perigo-claro); }

    .pal-editar {
        margin-top: var(--g-e4); padding: var(--g-e4);
        background: var(--g-superficie-2); border-radius: var(--g-raio);
    }
    .pal-editar-topo { display: flex; flex-wrap: wrap; align-items: flex-end; gap: var(--g-e3) var(--g-e4); margin-bottom: var(--g-e4); }
    .pal-idioma { flex: 1 1 220px; margin: 0; }
    .pal-acrescentar { flex: 0 1 auto; }
    .pal-busca { margin-bottom: var(--g-e3); }
    .pal-busca-rotulo { margin: 0 0 var(--g-e1); font-weight: 700; }
    .pal-contagem { margin: 0 0 var(--g-e2); color: var(--g-tinta-2); font-size: var(--g-t-legenda); }
    .pal-palavras { list-style: none; margin: 0 0 var(--g-e2); padding: 0; display: flex; flex-wrap: wrap; gap: var(--g-e2); }
    .pal-palavra {
        display: inline-flex; align-items: center; gap: var(--g-e1); margin: 0;
        min-height: var(--g-alvo); padding: 0 4px 0 var(--g-e4);
        background: var(--g-superficie); border: 2px solid var(--g-borda); border-radius: var(--g-raio-pilula);
        font-size: var(--g-t-grande); font-weight: 700;
    }
    .pal-palavra-x {
        display: grid; place-items: center; width: 40px; height: 40px; min-width: 40px; margin: 0; padding: 0;
        border: 0; border-radius: 50%; background: transparent; color: var(--g-tinta-2); cursor: pointer; line-height: 1;
    }
    .pal-palavra-x .ti { font-size: 20px; }
    .pal-palavra-x:hover { background: var(--g-perigo-claro); color: var(--g-perigo); }
    .pal-palavra-x:focus-visible { outline: none; box-shadow: var(--g-foco); }

    .pal-vazio { text-align: center; padding: var(--g-e5) var(--g-e3); }
    .pal-vazio img { width: 140px; height: 140px; object-fit: contain; margin-bottom: var(--g-e3); }
    .pal-vazio p { max-width: 520px; margin: 0 auto var(--g-e4); }
    .pal-vazio-botoes { justify-content: center; }

    @media (max-width: 600px) {
        .pal-topo-texto { display: none; }
        .pal-topo-btn { padding: 0; width: var(--g-alvo); min-width: var(--g-alvo); border-radius: var(--g-raio-pilula); }
        .pal-intro { padding: var(--g-e4); }
        .pal-acoes { padding-left: 0; }
        .pal-acoes .g-btn { flex: 1 1 45%; }
    }
</style>
