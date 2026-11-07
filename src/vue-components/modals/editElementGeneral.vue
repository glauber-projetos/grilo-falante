<template>
    <div class="eg">
        <div class="g-campo">
            <label for="inputLabel">{{ $t('gestaoBotaoTexto') }}</label>
            <div class="gm-campo-linha">
                <input type="text" id="inputLabel" v-focus @keydown.enter.exact="$emit('searchImage')" v-if="gridElement" v-model="gridElement.label[currentLang]" :placeholder="gridElement.type === GridElement.ELEMENT_TYPE_LIVE ? getLabelPlaceholder(currentLang) : $t('gestaoBotaoTextoExemplo')" autocomplete="off"/>
                <button type="button" class="g-btn eg-procurar" @click="$emit('searchImage')" :title="$t('gestaoBotaoProcurarFigura')">
                    <i class="ti ti-photo-search" aria-hidden="true"></i><span class="eg-procurar-texto">{{ $t('gestaoBotaoProcurarFigura') }}</span>
                </button>
            </div>
            <span class="g-dica">{{ $t('gestaoBotaoTextoDica') }}</span>
        </div>

        <div class="g-campo">
            <label for="inputPronunciation">{{ $t('gestaoBotaoComoFalar') }}</label>
            <div class="gm-campo-linha">
                <input type="text" id="inputPronunciation" v-if="gridElement" v-model="gridElement.pronunciation[currentLang]" :placeholder="$t('gestaoBotaoComoFalarExemplo')" autocomplete="off"/>
                <button type="button" class="g-btn g-btn-icone" @click="speak(currentLang)" :aria-label="$t('gestaoBotaoOuvir')" :title="$t('gestaoBotaoOuvir')">
                    <i class="ti ti-volume" aria-hidden="true"></i>
                </button>
            </div>
            <span class="g-dica">{{ $t('gestaoBotaoComoFalarDica') }}</span>
        </div>

        <div class="gm-grade" v-if="metadata">
            <div class="g-campo">
                <label for="colorCategory">{{ $t('gestaoBotaoCorTipo') }}</label>
                <select id="colorCategory" v-model="gridElement.colorCategory" @change="colorCategoryNotFitting = false; resetTestGrid()">
                    <option v-if="colorCategoryNotFitting" :value="colorCategoryNotFitting" disabled selected hidden>{{ $t("categoryFromOtherColorScheme", [$t(colorCategoryNotFitting)]) }}</option>
                    <option :value="undefined">{{ $t('gestaoBotaoSemTipo') }}</option>
                    <option v-for="category in colorCategories" :value="category">{{ category | translate }}</option>
                </select>
                <span class="g-dica">{{ $t('gestaoBotaoCorTipoDica') }}</span>
            </div>
            <div class="g-campo">
                <label for="backgroundColor">{{ metadata.colorConfig.colorMode === ColorConfig.COLOR_MODE_BORDER ? $t('gestaoBotaoCorBorda') : $t('gestaoBotaoCorFundo') }}</label>
                <div class="gm-campo-linha">
                    <input type="color" id="backgroundColor" :class="{'gm-cor-vazia': !gridElement.backgroundColor}" v-if="gridElement" v-model="gridElement.backgroundColor" @input="gridElement.colorCategory = undefined; resetTestGrid()"/>
                    <button type="button" class="g-btn" :disabled="!gridElement.backgroundColor" @click="gridElement.backgroundColor = null; resetTestGrid();">{{ $t('gestaoBotaoTirarCor') }}</button>
                </div>
                <span class="g-dica">{{ gridElement.backgroundColor ? $t('gestaoBotaoCorPropria') : $t('gestaoBotaoCorAutomatica') }}</span>
            </div>
        </div>

        <div class="g-campo">
            <label for="fontSize">{{ $t('gestaoBotaoTamanhoLetra') }}</label>
            <div class="gm-campo-linha eg-faixa">
                <input id="fontSize" type="range" min="0" max="70" step="1" :value="gridElement.fontSizePct || 0" @input="gridElement.fontSizePct = parseFloat($event.target.value); resetTestGrid()" :aria-valuetext="tamanhoLetraTexto"/>
                <span class="eg-valor" aria-hidden="true">{{ tamanhoLetraTexto }}</span>
                <button type="button" class="g-btn" :disabled="!gridElement.fontSizePct" @click="gridElement.fontSizePct = null; resetTestGrid();">{{ $t('gestaoBotaoAutomatico') }}</button>
            </div>
        </div>

        <label class="g-marcar">
            <input type="checkbox" id="inputHidden" v-if="gridElement" v-model="gridElement.hidden"/>
            <span>{{ $t('gestaoBotaoEsconder') }}<small class="g-dica eg-sub">{{ $t('gestaoBotaoEsconderDica') }}</small></span>
        </label>

        <details class="gm-avancado" v-if="metadata">
            <summary>{{ $t('gestaoMaisOpcoes') }}</summary>
            <div class="gm-avancado-corpo">
                <div class="eg-mais">
                    <div class="eg-mais-campos">
                        <div class="g-campo">
                            <label for="fontColor">{{ $t('gestaoBotaoCorLetra') }}</label>
                            <div class="gm-campo-linha">
                                <input id="fontColor" :class="{'gm-cor-vazia': !gridElement.fontColor}" v-model="gridElement.fontColor" type="color" @input="resetTestGrid"/>
                                <button type="button" class="g-btn" :disabled="!gridElement.fontColor" @click="gridElement.fontColor = null; resetTestGrid();">{{ $t('gestaoBotaoAutomatico') }}</button>
                            </div>
                        </div>
                        <div class="g-campo" v-if="metadata.colorConfig.colorMode === ColorConfig.COLOR_MODE_BOTH">
                            <label for="borderColor">{{ $t('gestaoBotaoCorBorda') }}</label>
                            <div class="gm-campo-linha">
                                <input type="color" id="borderColor" :class="{'gm-cor-vazia': !gridElement.borderColor}" v-if="gridElement" v-model="gridElement.borderColor" @input="gridElement.colorCategory = undefined; resetTestGrid()"/>
                                <button type="button" class="g-btn" :disabled="!gridElement.borderColor" @click="gridElement.borderColor = null; resetTestGrid();">{{ $t('gestaoBotaoTirarCor') }}</button>
                            </div>
                        </div>
                    </div>
                    <div class="eg-como-fica">
                        <span class="eg-como-fica-titulo">{{ $t('gestaoBotaoComoFica') }}</span>
                        <app-grid-display class="testGrid" v-if="metadata" :grid-data="testGridData" :metadata="metadata" :watch-for-changes="true"/>
                    </div>
                </div>

                <div class="g-campo">
                    <label for="addElementToCollectElement">{{ $t('gestaoBotaoVaiParaFrase') }}</label>
                    <select id="addElementToCollectElement" v-model="addElementToCollectElement">
                        <option :value="undefined">{{ $t('gestaoBotaoAutomatico') }}</option>
                        <option :value="GridElement.COLLECT_MODE_ALWAYS">{{ $t('gestaoBotaoFraseSempre') }}</option>
                        <option :value="GridElement.COLLECT_MODE_NEVER">{{ $t('gestaoBotaoFraseNunca') }}</option>
                    </select>
                    <span class="g-dica">{{ $t('gestaoBotaoVaiParaFraseDica') }}</span>
                </div>
                <label class="g-marcar">
                    <input type="checkbox" id="toggleInBar" v-if="gridElement" v-model="gridElement.toggleInBar"/>
                    <span>{{ $t('gestaoBotaoToqueDeNovoTira') }}</span>
                </label>
                <div class="g-campo">
                    <label for="vocabularyLevel">{{ $t('gestaoBotaoNivel') }}</label>
                    <select id="vocabularyLevel" v-model.number="gridElement.vocabularyLevel">
                        <option :value="null">{{ $t('gestaoBotaoNivelTodos') }}</option>
                        <option v-for="level in [...Array(10).keys()].map(i => i + 1)" :value="level">{{ level }}</option>
                    </select>
                    <span class="g-dica">{{ $t('gestaoBotaoNivelDica') }}</span>
                </div>
            </div>
        </details>

        <details class="gm-avancado">
            <summary>{{ $t('gestaoBotaoOutrosIdiomas') }}</summary>
            <div class="gm-avancado-corpo">
                <div class="gm-grade">
                    <div class="g-campo">
                        <label for="translationLanguage">{{ $t('gestaoBotaoIdioma') }}</label>
                        <select id="translationLanguage" v-model="chosenLocale">
                            <option v-for="lang in selectLanguages" :value="lang.code">
                                {{ lang | extractTranslationAppLang }} ({{ lang.code }})
                            </option>
                        </select>
                    </div>
                    <label class="g-marcar eg-marcar-meio">
                        <input type="checkbox" id="selectAllLanguages" v-model="selectAllLanguages"/>
                        <span>{{ $t('gestaoBotaoTodosIdiomas') }}</span>
                    </label>
                </div>
                <div class="g-campo">
                    <label for="translatedLabel">{{ $t('gestaoBotaoTextoEm', [chosenLocale]) }}</label>
                    <input type="text" id="translatedLabel" v-if="gridElement" v-model="gridElement.label[chosenLocale]" :placeholder="getLabelPlaceholder(chosenLocale)" :lang="chosenLocale" autocomplete="off"/>
                </div>
                <div class="g-campo">
                    <label for="translatedPronunciation">{{ $t('gestaoBotaoComoFalarEm', [chosenLocale]) }}</label>
                    <div class="gm-campo-linha">
                        <input type="text" id="translatedPronunciation" v-if="gridElement" v-model="gridElement.pronunciation[chosenLocale]" :placeholder="getPronunciationPlaceholderWithLang(chosenLocale)" :lang="chosenLocale" autocomplete="off"/>
                        <button type="button" class="g-btn g-btn-icone" @click="speak(chosenLocale)" :aria-label="$t('gestaoBotaoOuvir')" :title="$t('gestaoBotaoOuvir')">
                            <i class="ti ti-volume" aria-hidden="true"></i>
                        </button>
                    </div>
                </div>
            </div>
        </details>
    </div>
</template>

<script>
    import {i18nService} from "../../js/service/i18nService";
    import './../../css/modal.css';
    import {helpService} from "../../js/service/helpService";
    import {constants} from "../../js/util/constants.js";
    import {dataService} from "../../js/service/data/dataService.js";
    import {MetaData} from "../../js/model/MetaData.js";
    import {gridUtil} from "../../js/util/gridUtil.js";
    import {speechService} from "../../js/service/speechService";
    import AppGridDisplay from '../grid-display/appGridDisplay.vue';
    import { GridData } from '../../js/model/GridData';
    import { GridElement } from '../../js/model/GridElement';
    import { ColorConfig } from '../../js/model/ColorConfig';
    import {colorUtil} from "../../js/util/colorUtil";

    export default {
        components: { AppGridDisplay },
        props: ['gridElement', 'gridData'],
        data: function () {
            return {
                metadata: null,
                currentLang: i18nService.getContentLang(),
                colorCategories: [],
                constants: constants,
                testGridData: null,
                GridElement: GridElement,
                ColorConfig: ColorConfig,
                colorCategoryNotFitting: false,
                chosenLocale: 'en',
                selectAllLanguages: true,
                allLanguages: i18nService.getAllLanguages(),
                gridLanguages: []
            }
        },
        computed: {
            addElementToCollectElement: {
                get() {
                    if (!this.gridElement.collectMode && this.gridElement.dontCollect) {
                        return GridElement.COLLECT_MODE_NEVER;
                    }
                    return this.gridElement.collectMode;
                },
                set(selectedCollectOption) {
                    this.$set(this.gridElement, 'dontCollect', undefined);
                    this.$set(this.gridElement, 'collectMode', selectedCollectOption);
                }
            },
            tamanhoLetraTexto() {
                // só apresentação
                return this.gridElement.fontSizePct ? (this.gridElement.fontSizePct + ' %') : i18nService.t('gestaoBotaoAutomatico');
            },
            selectLanguages() {
                if (this.selectAllLanguages) {
                    return this.allLanguages;
                }
                return this.allLanguages.filter(lang =>
                    this.gridLanguages.includes(lang.code)
                );
            }
        },
        methods: {
            resetTestGrid() {
                let element = JSON.parse(JSON.stringify(this.gridElement));
                element.x = 0;
                element.y = 0;
                this.testGridData = new GridData({
                    gridElements: [element]
                });
            },
            getLabelPlaceholder(locale) {
                if (this.gridElement.type === GridElement.ELEMENT_TYPE_LIVE) {
                    return i18nService.t('canIncludePlaceholderLike', '{0}');
                }
                let langName = i18nService.te(`lang.${locale}`) ? i18nService.t(`lang.${locale}`) : locale;
                return `${i18nService.t('textHeading')} (${langName})`;
            },
            getPronunciationPlaceholderWithLang(locale) {
                let label = this.gridElement.label[locale] || '';
                let langName = i18nService.te(`lang.${locale}`) ? i18nService.t(`lang.${locale}`) : locale;
                if (label) {
                    return `${i18nService.t('pronunciationOf', label)} (${langName})`;
                }
                return `${i18nService.t('pronunciation')} (${langName})`;
            },
            speak(locale) {
                let speakText = this.gridElement.pronunciation[locale] || this.gridElement.label[locale];
                if (!speakText) {
                    return;
                }
                speechService.speak(speakText, {
                    lang: locale,
                    voiceLangIsTextLang: true
                });
            },
            findUsedLocales() {
                this.gridLanguages = gridUtil.getUsedLocales(this.gridData);
                this.selectAllLanguages = this.gridLanguages.length <= 1;
                let langs = this.gridLanguages.length > 1 ? this.gridLanguages : this.allLanguages.map(l => l.code);
                this.chosenLocale = langs.find(lang => lang !== this.currentLang) || 'en';
            }
        },
        mounted() {
            this.resetTestGrid();
            this.findUsedLocales();
            helpService.setHelpLocation('03_appearance_layout', '#edit-modal');
            dataService.getMetadata().then(metadata => {
                this.metadata = metadata;
                this.colorCategories = colorUtil.getActiveColorScheme(metadata).categories;
                if (!this.colorCategories.includes(this.gridElement.colorCategory)) {
                    this.colorCategoryNotFitting = this.gridElement.colorCategory;
                }
            })
        },
        beforeDestroy() {
            helpService.revertToLastLocation();
        }
    }
</script>

<style scoped>
.eg-procurar { flex: none; }
.eg-sub { display: block; font-weight: 400; }
.eg-faixa { align-items: center; flex-wrap: wrap; }
.eg-faixa > input[type="range"] { flex: 1 1 160px; min-width: 120px; width: auto; }
.eg-valor { min-width: 7ch; font-weight: 700; color: var(--g-tinta-2); }
.eg-mais { display: flex; flex-wrap: wrap; gap: var(--g-e4); align-items: flex-start; margin-bottom: var(--g-e2); }
.eg-mais-campos { flex: 1 1 260px; min-width: 0; }
.eg-como-fica { flex: none; display: flex; flex-direction: column; gap: var(--g-e1); }
.eg-como-fica-titulo { font-weight: 700; font-size: var(--g-t-legenda); color: var(--g-tinta-2); }
.testGrid { width: 160px; height: 160px; border-radius: var(--g-raio-p); overflow: hidden; border: 2px solid var(--g-borda); background: var(--g-superficie); }
.eg-marcar-meio { align-self: end; margin-bottom: var(--g-e4); }
@media (max-width: 600px) {
    .eg-procurar { width: var(--g-alvo); min-width: var(--g-alvo); padding: 0; }
    .eg-procurar-texto { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
}
</style>
