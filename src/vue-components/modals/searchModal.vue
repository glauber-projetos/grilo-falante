<template>
    <gestao-modal class="sm-veu" :titulo="$t('gestaoEdicaoBuscaTitulo')" icone="search" tamanho="m" @close="$emit('close')">
        <div class="sm">
            <search-bar :placeholder="$t('gestaoEdicaoBuscaPlaceholder')" v-model="searchTerm" :keydown-enter-fn="() => goToFirstResult()" :keydown-ctrl-enter-fn="() => goToFirstResult(true)" @input="search()" :debounce-time="300"></search-bar>

            <div class="g-aviso sm-aviso" v-if="results && !homeGridId">
                <i class="ti ti-info-circle" aria-hidden="true"></i>
                <span>{{ $t('gestaoEdicaoBuscaSemInicial') }}</span>
            </div>

            <ul v-if="results && results.length > 0" class="sm-lista">
                <li v-for="(result, index) in results" class="sm-item">
                    <button type="button" class="sm-resultado" @click="toResult(result, true)" :title="index === 0 ? `${$t('gestaoEdicaoBuscaMostrarCaminho')} ${$t('keyboardCtrlEnter')}` : $t('gestaoEdicaoBuscaMostrarCaminho')">
                        <span class="sm-figura">
                            <img v-if="result.elem.image" :src="result.elem.image.data || result.elem.image.url" alt=""/>
                            <i v-else class="ti ti-square" aria-hidden="true"></i>
                        </span>
                        <span class="sm-textos">
                            <span class="sm-rotulo" v-if="i18nService.getContentLang() === result.matchLang" v-html="highlightSearch(result.matchLabel)"></span>
                            <span class="sm-rotulo" v-if="i18nService.getContentLang() !== result.matchLang">
                                <span>{{ i18nService.getTranslation(result.elem.label) }}</span>
                                <small class="sm-outra-lingua">({{ i18nService.t(`lang.${result.matchLang}`) }}: <span v-html="highlightSearch(result.matchLabel)"></span>)</small>
                            </span>
                            <span class="sm-caminho" v-if="result.path && result.path.length > 0">
                                <template v-for="(pathElem, i) in result.path">
                                    <span v-if="i === 0" class="sm-passo"><i class="ti ti-home" aria-hidden="true"></i>{{ $t('gestaoPranchaInicial') }}</span>
                                    <span v-if="pathElem.toNextElementLabel" class="sm-passo"><i class="ti ti-chevron-right sm-sep" aria-hidden="true"></i>{{ pathElem.toNextElementLabel | extractTranslation }}</span>
                                </template>
                            </span>
                        </span>
                    </button>
                    <button type="button" class="g-btn g-btn-leve g-btn-icone sm-direto" @click="toResult(result)"
                            :aria-label="$t('gestaoEdicaoBuscaIrDireto')" :title="index === 0 ? `${$t('gestaoEdicaoBuscaIrDireto')} ${$t('keyboardEnter')}` : $t('gestaoEdicaoBuscaIrDireto')">
                        <i class="ti ti-arrow-right" aria-hidden="true"></i>
                    </button>
                </li>
            </ul>

            <div class="sm-estado" aria-live="polite">
                <p v-if="results === undefined" class="gm-vazio">
                    <i class="ti ti-list-search" aria-hidden="true"></i>{{ $t('gestaoEdicaoBuscaComece') }}
                </p>
                <p v-if="results === null" class="gm-vazio">
                    <i class="ti ti-loader-2 sm-girando" aria-hidden="true"></i>{{ $t('gestaoEdicaoBuscaProcurando') }}
                </p>
                <p v-if="results && results.length === 0 && searchTerm" class="gm-vazio">
                    <i class="ti ti-mood-empty" aria-hidden="true"></i>{{ $t('gestaoEdicaoBuscaNada') }}
                </p>
                <p v-if="overflow" class="g-dica sm-mais">{{ $t('gestaoEdicaoBuscaMuitos') }}</p>
            </div>
        </div>
    </gestao-modal>
</template>

<script>
    import GestaoModal from './gestaoModal.vue';
    import {dataService} from "../../js/service/data/dataService.js";
    import {i18nService} from "../../js/service/i18nService.js";
    import {Router} from "../../js/router.js";
    import {gridUtil} from "../../js/util/gridUtil.js";
    import {collectElementService} from "../../js/service/collectElementService.js";
    import SearchBar from '../components/searchBar.vue';
    import {dataUtil} from "../../js/util/dataUtil";

    export default {
        props: ['routeToEdit', 'options'],
        components: {
            SearchBar, GestaoModal
        },
        data: function () {
            return {
                grids: null,
                initPromise: null,
                searchTerm: '',
                results: undefined,
                graphList: [],
                homeGridId: null,
                i18nService: i18nService,
                idPathMap: null,
                overflow: false,
                vocabularyLevel: null,
                MAX_RESULTS: 10
            }
        },
        methods: {
            toResult(result, usePath) {
                if (this.routeToEdit) {
                    Router.toEditGrid(result.grid.id, result.elem.id);
                } else {
                    let highlightIds = [result.elem.id];
                    let firstGrid = result.grid.id;
                    if (usePath && result.path.length > 1) {
                        firstGrid = result.path[0].id;
                        highlightIds = result.path.map(e => e.toNextElementId);
                        highlightIds[highlightIds.length - 1] = result.elem.id;
                    }
                    Router.toGrid(firstGrid, {
                        highlightIds: highlightIds
                    });
                }
                this.close();
            },
            highlightSearch(text) {
                let index = text.toLocaleLowerCase().indexOf(this.searchTerm.toLocaleLowerCase());
                let realPart = text.substring(index, index + this.searchTerm.length);
                return text.replace(realPart, `<b>${realPart}</b>`)
            },
            goToFirstResult(usePath) {
                if (this.results && this.results.length > 0) {
                    this.toResult(this.results[0], usePath);
                }
            },
            async search(force) {
                let thiz = this;
                thiz.overflow = false;
                if (!force && thiz.searchTerm.length < 2) {
                    thiz.results = undefined;
                    return;
                }
                thiz.results = null;
                thiz.$forceUpdate();
                await new Promise(resolve => setTimeout(resolve, 10)); // to repaint and render "searching ..."
                await thiz.initPromise;
                if (!thiz.searchTerm) {
                    thiz.results = [];
                    return;
                }
                let results = [];
                let homeGridId = thiz.homeGridId || thiz.graphList[0].grid.id;
                let homeGridGraphElem = thiz.graphList.find(elem => elem.grid.id === homeGridId);
                if (!thiz.idPathMap) {
                    thiz.idPathMap = gridUtil.getIdPathMap(homeGridGraphElem);
                }
                let count = 0;
                for (let i = 0; i < thiz.grids.length; i++) {
                    let grid = thiz.grids[i];
                    for (let elem of grid.gridElements) {
                        count++;
                        let labels = Object.entries(elem.label).filter(([lang, label]) => !!label);
                        let hadMatch = false;
                        for (let [lang, label] of labels) {
                            let priority = getMatchPriority(label);
                            if (!hadMatch && priority > 0) {
                                hadMatch = true;
                                if (elem.image && elem.image.data === dataUtil.getDefaultRemovedPlaceholder()) {
                                    let realGrid = await dataService.getGrid(grid.id);
                                    realGrid.gridElements = gridUtil.getElementsOfVocabularyLevel(realGrid.gridElements, thiz.vocabularyLevel);
                                    thiz.grids[i] = realGrid;
                                    elem = realGrid.gridElements.find(e => e.id === elem.id);
                                }
                                addResult(grid, elem, label, lang, priority);
                            }
                        }
                    }
                }
                results.sort((a, b) => {
                    if (a.matchLang !== b.matchLang) {
                        if (a.matchLang === i18nService.getContentLang()) {
                            return -1;
                        }
                        if (b.matchLang === i18nService.getContentLang()) {
                            return 1;
                        }
                    }
                    if (a.path.length !== b.path.length) {
                        if (a.path.length === 0) return 1;
                        if (b.path.length === 0) return -1;
                        return a.path.length - b.path.length;
                    }
                    return a.priority - b.priority
                });
                if (results.length > thiz.MAX_RESULTS) {
                    results = results.slice(0, thiz.MAX_RESULTS - 1);
                    thiz.overflow = true;
                }
                thiz.results = results;

                function getMatchPriority(label) {
                    label = label.toLocaleLowerCase();
                    if (label.startsWith(thiz.searchTerm.toLocaleLowerCase())) {
                        return 1;
                    }
                    if (label.includes(thiz.searchTerm.toLocaleLowerCase())) {
                        return 2;
                    }
                    return -1;
                }

                function addResult(grid, elem, matchLabel, matchLang, priority) {
                    results.push({
                        grid: grid,
                        elem: elem,
                        matchLabel: matchLabel,
                        matchLang: matchLang,
                        priority: priority,
                        path: gridUtil.getGridPath(thiz.graphList, homeGridId, grid.id, thiz.idPathMap)
                    })
                }
            },
            close() {
                this.$emit('close');
            }
        },
        async mounted() {
            this.initPromise = new Promise(async resolve => {
                this.grids = await dataService.getGrids(false, true);
                let metadata = await dataService.getMetadata();
                this.homeGridId = metadata.homeGridId;
                if (!this.routeToEdit) {
                    this.vocabularyLevel = gridUtil.getCurrentVocabularyLevel(metadata);
                }
                for (let grid of this.grids) {
                    grid.gridElements = gridUtil.getElementsOfVocabularyLevel(grid.gridElements, this.vocabularyLevel);
                }
                let globalGrid = await dataService.getGlobalGrid();
                let homeGrid = this.grids.find(g => g.id === this.homeGridId);
                if (globalGrid && homeGrid) {
                    homeGrid.gridElements = homeGrid.gridElements.concat(gridUtil.getElementsOfVocabularyLevel(globalGrid.gridElements, this.vocabularyLevel));
                }
                this.graphList = gridUtil.getGraphList(this.grids);
                resolve();
            });
            if (this.options) {
                this.searchTerm = this.options.searchCollectedText ? collectElementService.getText() : this.options.searchText || '';
                if (this.searchTerm) {
                    this.search(true);
                }
            }
            $('.grid-item-content').removeClass('highlight');
        },
        beforeDestroy() {
        }
    }
</script>

<style scoped>
/* fica acima de tudo, como antes (a busca abre também por cima da prancha) */
.sm-veu { z-index: 9999; }
.sm { min-height: 40vh; display: flex; flex-direction: column; gap: var(--g-e4); }
.sm-aviso { margin: 0; }
.sm-lista { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: var(--g-e2); }
.sm-item {
    display: flex; align-items: stretch; gap: var(--g-e1); margin: 0;
    background: var(--g-superficie); border: 2px solid var(--g-borda); border-radius: var(--g-raio);
    overflow: hidden;
}
.sm-item:hover, .sm-item:focus-within { border-color: var(--g-folha); }
.sm-resultado {
    flex: 1; min-width: 0; display: flex; align-items: center; gap: var(--g-e3);
    margin: 0; padding: var(--g-e2) var(--g-e3); height: auto; min-height: 72px;
    background: transparent; border: none; border-radius: 0; box-shadow: none;
    color: var(--g-tinta); font-family: var(--g-fonte); font-size: var(--g-t-grande); font-weight: 400;
    text-transform: none; letter-spacing: 0; line-height: 1.3; text-align: left; white-space: normal; cursor: pointer;
}
.sm-resultado:active { background: var(--g-folha-clara); }
.sm-resultado:focus-visible { outline: none; box-shadow: inset 0 0 0 3px #1b6fd8; }
.sm-figura {
    flex: none; width: 56px; height: 56px; display: grid; place-items: center; overflow: hidden;
    background: var(--g-superficie-2); border-radius: var(--g-raio-p); color: var(--g-tinta-3);
}
.sm-figura img { max-width: 100%; max-height: 100%; object-fit: contain; }
.sm-figura .ti { font-size: 1.6em; }
.sm-textos { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.sm-rotulo { font-weight: 700; overflow-wrap: anywhere; }
.sm-rotulo :deep(b) { background: var(--g-girassol-claro); border-radius: 4px; padding: 0 2px; }
.sm-outra-lingua { font-weight: 400; color: var(--g-tinta-2); font-size: var(--g-t-legenda); }
.sm-caminho { display: flex; flex-wrap: wrap; align-items: center; gap: 0 var(--g-e1); color: var(--g-tinta-2); font-size: var(--g-t-legenda); }
.sm-passo { display: inline-flex; align-items: center; gap: var(--g-e1); }
.sm-passo .ti { font-size: 1.1em; }
.sm-sep { color: var(--g-tinta-3); }
.sm-direto { align-self: center; margin-right: var(--g-e1); flex: none; }
.sm-estado > .gm-vazio { margin: 0; }
.sm-mais { text-align: center; margin: 0; }
.sm-girando { width: 1em; animation: sm-girar 1s linear infinite; }
@keyframes sm-girar { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) {
    .sm-girando { animation: none; }
}
</style>
