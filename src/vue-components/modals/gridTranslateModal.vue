<template>
    <gestao-modal :titulo="$t('gestaoEdicaoTraduzirTitulo')" :subtitulo="$t('gestaoEdicaoTraduzirSubtitulo')" icone="language" tamanho="g"
                  @close="$emit('close')" @keyup.ctrl.enter.native="save()">
        <div v-if="gridData !== undefined">
            <section class="gm-secao">
                <div class="gm-grade">
                    <div class="g-campo">
                        <label for="gridSelect">{{ $t('gestaoEdicaoTraduzirQual') }}</label>
                        <select id="gridSelect" v-model="gridData">
                            <option :value="null">{{ $t('gestaoEdicaoTraduzirTodas') }}</option>
                            <option v-for="grid in allGrids" :value="grid">{{grid.label | extractTranslation}}</option>
                        </select>
                    </div>
                    <div class="g-campo">
                        <label for="translateType">{{ $t('gestaoEdicaoTraduzirOque') }}</label>
                        <select id="translateType" v-model="translateType">
                            <option v-for="type in TRANSLATE_TYPES" :value="type">{{ nomeTipo(type) }}</option>
                        </select>
                    </div>
                </div>
                <label class="g-marcar" v-if="!gridData">
                    <input id="hideKeyboards" type="checkbox" v-model="hideKeyboards"/>
                    <span>{{ $t('gestaoEdicaoTraduzirSemTeclados') }}</span>
                </label>
            </section>

            <section class="gm-secao">
                <h3><i class="ti ti-language" aria-hidden="true"></i>{{ $t('gestaoEdicaoTraduzirIdiomas') }}</h3>
                <div class="gt-idiomas">
                    <div class="gt-idioma">
                        <span class="gt-idioma-rotulo">{{ $t('gestaoEdicaoTraduzirDe') }}</span>
                        <strong class="gt-idioma-fixo">{{currentLangTranslated}} ({{currentLocale}})</strong>
                    </div>
                    <i class="ti ti-arrow-right gt-seta" aria-hidden="true"></i>
                    <div class="g-campo gt-idioma">
                        <label for="chosenLocale" class="gt-idioma-rotulo">{{ $t('gestaoEdicaoTraduzirPara') }}</label>
                        <select id="chosenLocale" v-model="chosenLocale">
                            <option v-for="lang in allLanguages.filter(lang => lang.code !== currentLocale)" :value="lang.code">{{lang | extractTranslationAppLang}} ({{lang.code}})</option>
                        </select>
                    </div>
                </div>
                <div class="gt-usados" v-if="usedLocales.length > 0">
                    <span class="g-dica">{{ $t('gestaoEdicaoTraduzirUsados') }}</span>
                    <div class="gt-usados-lista">
                        <template v-for="locale in usedLocales">
                            <button type="button" v-if="locale !== currentLocale" :key="locale" class="g-btn gt-usado" :aria-pressed="(chosenLocale === locale).toString()" @click="chosenLocale = locale">{{getLocaleTranslation(locale)}}</button>
                        </template>
                    </div>
                </div>

                <details class="gm-avancado">
                    <summary>{{ $t('gestaoEdicaoTraduzirCopiarColar') }}</summary>
                    <div class="gm-avancado-corpo">
                        <p class="g-dica">{{ $t('gestaoEdicaoTraduzirCopiarColarDica') }}</p>
                        <div class="gt-cc">
                            <div class="gt-cc-grupo">
                                <strong>{{currentLangTranslated}}</strong>
                                <div class="g-linha">
                                    <button type="button" class="g-btn" @click.exact="copy(currentLocale)" @click.ctrl.exact="copy(currentLocale, true)" :title="$t('copyColumn')">
                                        <i class="ti ti-copy" aria-hidden="true"></i>{{ $t('gestaoEdicaoTraduzirCopiar') }}
                                    </button>
                                    <button type="button" class="g-btn" @click.exact="paste(currentLocale)" @click.ctrl.exact="paste(currentLocale, true)" :title="$t('pasteColumn')">
                                        <i class="ti ti-clipboard" aria-hidden="true"></i>{{ $t('gestaoEdicaoTraduzirColar') }}
                                    </button>
                                </div>
                            </div>
                            <div class="gt-cc-grupo">
                                <strong>{{chosenLangTranslated}}</strong>
                                <div class="g-linha">
                                    <button type="button" class="g-btn" @click.exact="copy(chosenLocale)" @click.ctrl.exact="copy(chosenLocale, true)" :title="$t('copyColumn')">
                                        <i class="ti ti-copy" aria-hidden="true"></i>{{ $t('gestaoEdicaoTraduzirCopiar') }}
                                    </button>
                                    <button type="button" class="g-btn" @click.exact="paste(chosenLocale)" @click.ctrl.exact="paste(chosenLocale, true)" :title="$t('pasteColumn')">
                                        <i class="ti ti-clipboard" aria-hidden="true"></i>{{ $t('gestaoEdicaoTraduzirColar') }}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </details>
            </section>

            <div id="translationList">
                <div class="gt-cabecalho" aria-hidden="true">
                    <span class="gt-cabecalho-fig"></span>
                    <span>{{currentLangTranslated}}</span>
                    <span>{{chosenLangTranslated}}</span>
                </div>
                <section v-if="gridsWithLabel.length > 0 && translateType === TRANSLATE_TYPES.ALL_TEXTS" class="gt-bloco">
                    <h3 class="gm-secao-titulo"><i class="ti ti-layout-grid" aria-hidden="true"></i>{{ $t('gestaoEdicaoTraduzirNomes') }}</h3>
                    <ul class="gt-lista">
                        <li v-for="data in gridsWithLabel" class="gt-item">
                            <span class="gt-fig"><i class="ti ti-layout-grid" aria-hidden="true"></i></span>
                            <input type="text" :placeholder="`(${currentLangTranslated})`" :aria-label="currentLangTranslated" :lang="currentLocale" v-model="data.label[currentLocale]" @change="changedGrid(data)"/>
                            <input type="text" :placeholder="`(${chosenLangTranslated})`" :aria-label="chosenLangTranslated" :lang="chosenLocale" v-model="data.label[chosenLocale]" @change="changedGrid(data)"/>
                        </li>
                    </ul>
                </section>
                <section v-if="actionElems.length > 0 && translateType === TRANSLATE_TYPES.ALL_TEXTS" class="gt-bloco">
                    <h3 class="gm-secao-titulo"><i class="ti ti-message" aria-hidden="true"></i>{{ $t('gestaoEdicaoTraduzirFalas') }}</h3>
                    <ul class="gt-lista">
                        <template v-for="item in actionElems">
                            <template v-for="action in item.element.actions">
                                <li class="gt-item" v-if="action.modelName === GridActionSpeakCustom.getModelName()">
                                    <span class="gt-fig"><img v-if="item.element.image && (item.element.image.url || item.element.image.data)" :src="item.element.image.url || item.element.image.data" alt=""/><i v-else class="ti ti-message" aria-hidden="true"></i></span>
                                    <input type="text" :placeholder="`(${currentLangTranslated})`" :aria-label="currentLangTranslated" :lang="currentLocale" :i18nid="getI18nId(item.grid, item.element, GridActionSpeakCustom.getModelName())" v-model="action.speakText[currentLocale]" @change="changedGrid(item.grid)"/>
                                    <input type="text" :placeholder="`(${chosenLangTranslated})`" :aria-label="chosenLangTranslated" :lang="chosenLocale" :i18nid="getI18nId(item.grid, item.element, GridActionSpeakCustom.getModelName())" v-model="action.speakText[chosenLocale]" @change="changedGrid(item.grid)"/>
                                </li>
                            </template>
                        </template>
                    </ul>
                </section>
                <section v-if="translateElements.length" class="gt-bloco">
                    <h3 class="gm-secao-titulo"><i class="ti ti-square" aria-hidden="true"></i>{{ $t('gestaoEdicaoTraduzirBotoes') }}</h3>
                    <ul class="gt-lista">
                        <li v-for="item in translateElements" class="gt-item">
                            <span class="gt-fig">
                                <img v-if="item.element.image && (item.element.image.url || item.element.image.data)" :src="item.element.image.url || item.element.image.data" alt=""/>
                            </span>
                            <input v-if="[TRANSLATE_TYPES.ALL_TEXTS, TRANSLATE_TYPES.ELEMENT_LABELS].includes(translateType)" type="text" :placeholder="`(${currentLangTranslated})`" :aria-label="currentLangTranslated"
                                   :lang="currentLocale" :i18nid="getI18nId(item.grid, item.element)" v-model="item.element.label[currentLocale]" @change="changedGrid(item.grid)"/>
                            <input v-if="[TRANSLATE_TYPES.ALL_TEXTS, TRANSLATE_TYPES.ELEMENT_LABELS].includes(translateType)" type="text" :placeholder="`(${chosenLangTranslated})`" :aria-label="chosenLangTranslated"
                                   :lang="chosenLocale" :i18nid="getI18nId(item.grid, item.element)" v-model="item.element.label[chosenLocale]" @change="changedGrid(item.grid)"/>
                            <div v-if="translateType === TRANSLATE_TYPES.ELEMENT_PRONUNCIATIONS" class="gt-pron">
                                <input type="text" :placeholder="getPronunciationPlaceholder(item.element, currentLocale)" :aria-label="getPronunciationPlaceholder(item.element, currentLocale)"
                                       :lang="currentLocale" :i18nid="getI18nId(item.grid, item.element, 'pronunciation')" v-model="item.element.pronunciation[currentLocale]" @change="changedGrid(item.grid)"
                                       :data-grid-id="item.grid.id" :data-element-id="item.element.id" :key="item.element.id"/>
                                <button type="button" @click="speak(item.element, currentLocale)" class="g-btn g-btn-leve g-btn-icone" :aria-label="$t('gestaoEdicaoTraduzirOuvir')" :title="$t('gestaoEdicaoTraduzirOuvir')"><i class="ti ti-player-play" aria-hidden="true"></i></button>
                            </div>
                            <div v-if="translateType === TRANSLATE_TYPES.ELEMENT_PRONUNCIATIONS" class="gt-pron">
                                <input type="text" :placeholder="getPronunciationPlaceholder(item.element, chosenLocale)" :aria-label="getPronunciationPlaceholder(item.element, chosenLocale)"
                                       :lang="chosenLocale" :i18nid="getI18nId(item.grid, item.element, 'pronunciation')" v-model="item.element.pronunciation[chosenLocale]" @change="changedGrid(item.grid)"
                                       :data-grid-id="item.grid.id" :data-element-id="item.element.id" :key="item.grid.id + item.element.id"/>
                                <button type="button" @click="speak(item.element, chosenLocale)" class="g-btn g-btn-leve g-btn-icone" :aria-label="$t('gestaoEdicaoTraduzirOuvir')" :title="$t('gestaoEdicaoTraduzirOuvir')"><i class="ti ti-player-play" aria-hidden="true"></i></button>
                            </div>
                        </li>
                    </ul>
                </section>
                <p v-if="!translateElements.length && !(translateType === TRANSLATE_TYPES.ALL_TEXTS && (actionElems.length || gridsWithLabel.length))" class="gm-vazio">
                    <i class="ti ti-mood-empty" aria-hidden="true"></i>{{ $t('gestaoEdicaoTraduzirNada') }}
                </p>
            </div>
        </div>
        <p v-else class="gm-vazio"><i class="ti ti-loader-2" aria-hidden="true"></i>{{ $t('gestaoEdicaoCarregando') }}</p>

        <template #rodape>
            <button type="button" class="g-btn" @click="$emit('close')" :title="$t('keyboardEsc')">{{ $t('gestaoCancelar') }}</button>
            <button type="button" class="g-btn g-btn-principal" @click="save()" :title="$t('keyboardCtrlEnter')">
                <i class="ti ti-check" aria-hidden="true"></i>{{ $t('gestaoSalvar') }}
            </button>
        </template>
    </gestao-modal>
</template>

<script>
    import $ from '../../js/externals/jquery.js';
    import {i18nService} from "../../js/service/i18nService";
    import GestaoModal from './gestaoModal.vue';
    import {GridActionSpeakCustom} from "../../js/model/GridActionSpeakCustom";
    import {util} from "../../js/util/util";
    import {dataService} from "../../js/service/data/dataService";
    import { GridData } from '../../js/model/GridData';
    import { speechService } from '../../js/service/speechService';

    const TRANSLATE_TYPES = {
        ALL_TEXTS: "ALL_TEXTS",
        ELEMENT_LABELS: "ELEMENT_LABELS",
        ELEMENT_PRONUNCIATIONS: "ELEMENT_PRONUNCIATIONS"
    }

    export default {
        components: {GestaoModal},
        props: ['gridDataId'],
        data: function () {
            return {
                gridData: undefined,
                allGrids: undefined,
                currentLocale: i18nService.getContentLang(),
                chosenLocale: i18nService.isCurrentContentLangEN() ? 'de' : 'en',
                GridActionSpeakCustom: GridActionSpeakCustom,
                allLanguages: i18nService.getAllLanguages(),
                usedLocales: [],
                changedGrids: [],
                hideKeyboards: true,
                originalElementInfo: {}, // grid-id + element-id => {label: originalLabelObject, hasImage: true/false}, tells if element should be shown in translate view
                translateType: TRANSLATE_TYPES.ALL_TEXTS,
                TRANSLATE_TYPES: TRANSLATE_TYPES
            }
        },
        computed: {
            currentLangTranslated: function () {
                return this.getLocaleTranslation(this.currentLocale);
            },
            chosenLangTranslated: function () {
                return this.getLocaleTranslation(this.chosenLocale);
            },
            selectedGrids() {
                if (!this.gridData && !this.allGrids) {
                    return [];
                }
                return this.gridData ? [this.gridData] : this.allGrids;
            },
            allElements() {
                let result = [];
                for (let grid of this.selectedGrids) {
                    result = result.concat(grid.gridElements.map(el => ({ element: el, grid: grid })));
                }
                if (!this.gridData && this.hideKeyboards) {
                    result = result.filter(data => data.grid.keyboardMode !== GridData.KEYBOARD_ENABLED);
                }
                result.sort((a, b) => {
                    if (this.originalHasLabel(a) && !this.originalHasLabel(b)) {
                        return -1;
                    }
                    if (!this.originalHasLabel(a) && this.originalHasLabel(b)) {
                        return 1;
                    }
                    if (a.grid.keyboardMode === GridData.KEYBOARD_ENABLED && b.grid.keyboardMode !== GridData.KEYBOARD_ENABLED) {
                        return 1;
                    }
                    if (a.grid.keyboardMode !== GridData.KEYBOARD_ENABLED && b.grid.keyboardMode === GridData.KEYBOARD_ENABLED) {
                        return -1;
                    }
                    return 0;
                });
                return result;
            },
            translateElements() {
                return this.allElements.filter(data => this.originalHasLabel(data) || this.originalHasImage(data));
            },
            actionElems() {
                return this.allElements.filter(data => data.element.actions.some(action => action.modelName === GridActionSpeakCustom.getModelName() && action.speakText[this.currentLocale]));
            },
            gridsWithLabel() {
                return this.selectedGrids.filter(grid => this.originalElementInfo[grid.id].label[this.currentLocale]);
            }
        },
        methods: {
            save() {
                let thiz = this;
                dataService.saveGrids(thiz.changedGrids).then(() => {
                    thiz.$emit('reload');
                    thiz.$emit('close');
                });
            },
            changedGrid(gridChanged) {
                if (!gridChanged) {
                    this.changedGrids = this.allGrids;
                } else if (this.changedGrids.indexOf(gridChanged) === -1) {
                    this.changedGrids.push(gridChanged);
                }
            },
            originalHasLabel(data) {
                return !!this.originalElementInfo[data.grid.id + data.element.id].label[this.currentLocale];
            },
            originalHasImage(data) {
                return this.originalElementInfo[data.grid.id + data.element.id].hasImage;
            },
            getPronunciationPlaceholder(gridElement, locale) {
                let label = gridElement.label[locale] || "";
                return i18nService.t('pronunciationOf', label);
            },
            // só apresentação: nomes simples dos tipos de tradução
            nomeTipo(type) {
                let chaves = {ALL_TEXTS: "gestaoEdicaoTraduzirTipoTudo", ELEMENT_LABELS: "gestaoEdicaoTraduzirTipoBotoes", ELEMENT_PRONUNCIATIONS: "gestaoEdicaoTraduzirTipoPronuncia"};
                return chaves[type] ? this.$t(chaves[type]) : this.$t(type);
            },
            getLocaleTranslation(locale) {
                return i18nService.getTranslationAppLang(this.allLanguages.filter(lang => lang.code === locale)[0]);
            },
            speak(element, locale) {
                let speakText = element.pronunciation[locale] || element.label[locale];
                speechService.speak(speakText, {
                    lang: locale,
                    voiceLangIsTextLang: true
                });
            },
            copy(locale, withKeys) {
                let elements = $(`#translationList input[lang='${locale}']`).toArray();
                let text = null;
                if (withKeys) {
                    let array = elements.map(e => {
                        return {key: e.getAttribute('i18nid'), value: e.value}
                    }).filter(e => !!e.key);
                    text = JSON.stringify(array);
                } else {
                    let otherLocale = locale === this.currentLocale ? this.chosenLocale : this.currentLocale;
                    let elements2 = $(`#translationList input[lang='${otherLocale}']`).toArray();
                    text = '';
                    for (let i = 0; i < elements.length; i++) {
                        text += elements[i].value + '\n';
                    }
                }
                util.copyToClipboard(text);
            },
            paste(locale, withKeys) {
                util.getClipboardContent().then(result => {
                    if (!result) {
                        return;
                    }
                    this.changedGrid(this.gridData);
                    if (withKeys) {
                        let array = JSON.parse(result);
                        let counter = 0;
                        for (let pastedElement of array) {
                            let el = $(`#translationList input[i18nid='${pastedElement.key}'][lang='${locale}']`).toArray()[0];
                            if (el && pastedElement.value) {
                                $(el).val(pastedElement.value);
                                $(el)[0].dispatchEvent(new Event('input'));
                                counter++;
                            }
                        }
                        log.info(`inserted ${counter} (of ${array.length}) translations from json from clipboard.`);
                    } else {
                        let clipBoardTexts = result.trim().split('\n').map(e => e.trim());
                        let elements = $(`#translationList input[lang='${locale}']`).toArray();
                        let otherLocale = locale === this.currentLocale ? this.chosenLocale : this.currentLocale;
                        let elements2 = $(`#translationList input[lang='${otherLocale}']`).toArray();
                        for (let i = 0; i < elements.length; i++) {
                            let gridId = $(elements[i]).data('grid-id');
                            let elementId = $(elements[i]).data('element-id');
                            let element = this.getElement(gridId, elementId) || {};
                            let label = element.label || {};
                            let clipBoardText = clipBoardTexts[i] || "";
                            if (clipBoardText && (label[locale] !== clipBoardText)) {
                                $(elements[i]).val(clipBoardTexts[i]);
                                $(elements[i])[0].dispatchEvent(new Event('input'));
                            }
                        }
                    }
                })
            },
            getElement(gridId, elementId) {
                if (!gridId || !elementId) {
                    return null;
                }
                let grid = this.allGrids.find(g => g.id === gridId) || {};
                let elements = grid.gridElements || [];
                return elements.find(e => e.id === elementId);
            },
            getI18nId(gridData, gridElement, prefix) {
                prefix = prefix || '';
                let imageData = gridElement.image ? (gridElement.image.url || gridElement.image.data) : '';
                imageData = imageData || '';
                imageData = imageData.substring(0, 100);
                return btoa('' + gridData.gridElements.length + gridData.rowCount + gridData.minColumnCount + gridElement.x + gridElement.y + prefix + imageData);
            }
        },
        mounted() {
            dataService.getGrids(true).then((grids) => {
                this.allGrids = JSON.parse(JSON.stringify(grids));
                this.allGrids.sort((g1, g2) => i18nService.getTranslation(g1.label).localeCompare(i18nService.getTranslation(g2.label)));
                this.gridData = this.allGrids.filter(grid => grid.id === this.gridDataId)[0];
                for (let gridData of this.allGrids) {
                    this.originalElementInfo[gridData.id] = {
                        label: JSON.parse(JSON.stringify(gridData.label))
                    };
                    for (let element of gridData.gridElements) {
                        let hasImage = element.image && !!(element.image.url || element.image.data);
                        this.originalElementInfo[gridData.id + element.id] = {
                            label: JSON.parse(JSON.stringify(element.label)),
                            hasImage: hasImage
                        };
                        for (let lang of Object.keys(element.label)) {
                            if (!this.usedLocales.includes(lang) && !!element.label[lang]) {
                                this.usedLocales.push(lang);
                            }
                        }
                    }
                }
                this.usedLocales.sort((a, b) => this.getLocaleTranslation(a).localeCompare(this.getLocaleTranslation(b)));
            });
        }
    }
</script>

<style scoped>
.gm-secao > .gm-grade { margin-bottom: 0; }
.gt-idiomas { display: flex; flex-wrap: wrap; align-items: flex-end; gap: var(--g-e2) var(--g-e4); }
.gt-idioma { flex: 1 1 220px; min-width: 0; margin-bottom: 0; display: flex; flex-direction: column; gap: var(--g-e1); }
.gt-idioma-rotulo { font-weight: 700; }
.gt-idioma-fixo {
    display: flex; align-items: center; min-height: var(--g-alvo); padding: 0 var(--g-e3);
    background: var(--g-superficie-2); border: 2px solid var(--g-borda); border-radius: var(--g-raio); font-size: var(--g-t-grande);
}
.gt-seta { font-size: 28px; color: var(--g-folha-escura); align-self: center; margin-top: 24px; }
.gt-usados { margin-top: var(--g-e3); }
.gt-usados-lista { display: flex; flex-wrap: wrap; gap: var(--g-e2); margin-top: var(--g-e1); }
.gt-usado { min-height: 40px; padding: 0 var(--g-e3); font-size: var(--g-t-legenda); }
.gt-usado[aria-pressed="true"] { border-color: var(--g-folha); background: var(--g-folha-clara); }
.gt-cc { display: flex; flex-wrap: wrap; gap: var(--g-e4); }
.gt-cc-grupo { display: flex; flex-direction: column; gap: var(--g-e2); }

.gt-cabecalho, .gt-item {
    display: grid; grid-template-columns: 48px minmax(0, 1fr) minmax(0, 1fr); gap: var(--g-e2); align-items: center;
}
.gt-cabecalho { padding: 0 var(--g-e2) var(--g-e2); font-weight: 700; color: var(--g-tinta-2); font-size: var(--g-t-legenda); }
.gt-bloco { margin-bottom: var(--g-e5); }
.gt-lista { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: var(--g-e2); }
.gt-item { margin: 0; padding: var(--g-e2); background: var(--g-superficie); border: 2px solid var(--g-borda); border-radius: var(--g-raio); }
.gt-item:focus-within { border-color: var(--g-folha); }
.gt-fig {
    width: 48px; height: 48px; display: grid; place-items: center; overflow: hidden;
    background: var(--g-superficie-2); border-radius: var(--g-raio-p); color: var(--g-tinta-3);
}
.gt-fig img { max-width: 100%; max-height: 100%; object-fit: contain; }
.gt-fig .ti { font-size: 1.5em; }
.gt-item input[type="text"] {
    width: 100%; min-width: 0; min-height: var(--g-alvo); margin: 0; padding: var(--g-e2) var(--g-e3);
    border: 2px solid var(--g-borda); border-radius: var(--g-raio-p); background: var(--g-superficie);
    color: var(--g-tinta); font-family: var(--g-fonte); font-size: var(--g-t-corpo); box-shadow: none;
}
.gt-item input[type="text"]:focus { border-color: var(--g-folha); }
.gt-item input[type="text"]:focus-visible { outline: none; box-shadow: var(--g-foco); }
.gt-pron { display: flex; align-items: center; gap: var(--g-e1); min-width: 0; }
.gt-pron input[type="text"] { flex: 1; }
@media (max-width: 600px) {
    .gt-cabecalho { display: none; }
    .gt-item { grid-template-columns: 48px minmax(0, 1fr); }
    .gt-item > :not(.gt-fig) { grid-column: 2; }
    .gt-item > .gt-fig { grid-row: span 2; align-self: start; }
    .gt-seta { transform: rotate(90deg); margin: 0 auto; flex-basis: 100%; text-align: center; }
}
</style>
