<template>
    <div class="aj-aparencia">
        <div class="aj-aparencia-grade">
            <div class="aj-aparencia-campos">
                <h3 class="aj-sub">{{ $t('ajustesAparenciaTexto') }}</h3>
                <ajuste-deslizar id="ajTamanhoTexto" :label="$t('ajustesAparenciaTamanhoTexto')" unit="%" min="0" max="100" step="1"
                                 :rotulo-min="$t('ajustesAparenciaPequeno')" :rotulo-max="$t('ajustesAparenciaGrande')"
                                 v-model.number="metadata.textConfig.fontSizePct" @change="saveMetadata(metadata)"/>
                <ajuste-deslizar id="ajTamanhoSoTexto" :label="$t('ajustesAparenciaTamanhoSoTexto')" unit="%" min="0" max="100" step="1"
                                 :rotulo-min="$t('ajustesAparenciaPequeno')" :rotulo-max="$t('ajustesAparenciaGrande')"
                                 v-model.number="metadata.textConfig.onlyTextFontSizePct" @change="saveMetadata(metadata)"/>

                <h3 class="aj-sub">{{ $t('ajustesAparenciaCoresPalavras') }}</h3>
                <label class="g-marcar">
                    <input id="griloWordColors" type="checkbox" :checked="griloColorsOn" @change="setGriloColors($event.target.checked)"/>
                    <span>{{ $t('griloWordColors') }}</span>
                </label>
                <p class="g-dica">{{ $t('griloWordColorsHint') }}</p>
                <ul class="aj-legenda" aria-hidden="true">
                    <li v-for="(cat, index) in constants.CS_GRILO_CATEGORIES" :style="`background-color: ${constants.CS_GRILO_FILLS[index]}; border-color: ${constants.CS_GRILO_EDGES[index]};`">{{ $t(cat) }}</li>
                </ul>

                <h3 class="aj-sub">{{ $t('ajustesAparenciaTema') }}</h3>
                <div class="aj-escolha" role="group" :aria-label="$t('ajustesAparenciaTema')">
                    <button class="g-btn" :aria-pressed="!temaEscuro ? 'true' : 'false'" @click="toLightMode"><i class="ti ti-sun" aria-hidden="true"></i>{{ $t('ajustesAparenciaClaro') }}</button>
                    <button class="g-btn" :aria-pressed="temaEscuro ? 'true' : 'false'" @click="toDarkMode"><i class="ti ti-moon" aria-hidden="true"></i>{{ $t('ajustesAparenciaEscuro') }}</button>
                </div>
                <p class="g-dica">{{ $t('ajustesAparenciaTemaDica') }}</p>

                <h3 class="aj-sub">{{ $t('ajustesAparenciaEstilo') }}</h3>
                <div class="aj-escolha" role="group" :aria-label="$t('ajustesAparenciaEstilo')">
                    <button class="g-btn" :aria-pressed="metadata.colorConfig.colorMode === ColorConfig.COLOR_MODE_BACKGROUND ? 'true' : 'false'" @click="toDefaultBgColored">
                        <span class="aj-amostra aj-amostra-fundo" aria-hidden="true"></span>{{ $t('ajustesAparenciaEstiloFundo') }}
                    </button>
                    <button class="g-btn" :aria-pressed="metadata.colorConfig.colorMode === ColorConfig.COLOR_MODE_BORDER ? 'true' : 'false'" @click="toDefaultBorderColored">
                        <span class="aj-amostra aj-amostra-borda" aria-hidden="true"></span>{{ $t('ajustesAparenciaEstiloBorda') }}
                    </button>
                    <button class="g-btn" :aria-pressed="metadata.colorConfig.colorMode === ColorConfig.COLOR_MODE_BOTH ? 'true' : 'false'" @click="toDefaultBothColored">
                        <span class="aj-amostra aj-amostra-ambos" aria-hidden="true"></span>{{ $t('ajustesAparenciaEstiloAmbos') }}
                    </button>
                </div>

                <h3 class="aj-sub">{{ $t('ajustesAparenciaFotosMovimento') }}</h3>
                <label class="g-marcar">
                    <input id="photosFillCell" type="checkbox" :checked="metadata.photosFillCell !== false" @change="$set(metadata, 'photosFillCell', $event.target.checked); saveMetadata(metadata)"/>
                    <span>{{ $t('photosFillCell') }}</span>
                </label>
                <label class="g-marcar">
                    <input id="reduceMotion" type="checkbox" v-model="reduceMotion" @change="setReduceMotion"/>
                    <span>{{ $t('reduceMotion') }}</span>
                </label>
                <p class="g-dica">{{ systemReducesMotion ? $t('reduceMotionSystemOn') : $t('reduceMotionHint') }}</p>
            </div>

            <aside class="aj-previa" :aria-label="$t('ajustesAparenciaPrevia')">
                <h3 class="aj-sub">{{ $t('ajustesAparenciaPrevia') }}</h3>
                <div class="g-campo">
                    <label for="testElementLabel">{{ $t('ajustesAparenciaPreviaPalavra') }}</label>
                    <input id="testElementLabel" type="text" v-model="testElementLabel" @input="resetTestGrid"/>
                </div>
                <div class="aj-previa-prancha">
                    <app-grid-display v-if="testGridData" :grid-data="testGridData" :metadata="metadata" :watch-for-changes="true"/>
                </div>
            </aside>
        </div>

        <details class="aj-mais" @toggle="maisAberto = $event.target.open">
            <summary><i class="ti ti-adjustments-horizontal" aria-hidden="true"></i>{{ $t('ajustesAparenciaMais') }}</summary>
            <div class="aj-mais-corpo" v-if="maisAberto">
                <h3 class="aj-sub">{{ $t('ajustesAparenciaTextoBotoes') }}</h3>
                <div class="aj-duas">
                    <div class="g-campo">
                        <label for="textPos">{{ $t('textPosition') }}</label>
                        <select id="textPos" v-model="metadata.textConfig.textPosition" @change="saveMetadata(metadata)">
                            <option :value="TextConfig.TEXT_POS_ABOVE">{{ $t('top') }}</option>
                            <option :value="TextConfig.TEXT_POS_BELOW">{{ $t('bottom') }}</option>
                        </select>
                    </div>
                    <div class="g-campo">
                        <label for="fontFamily">{{ $t('fontFamily') }}</label>
                        <select id="fontFamily" v-model="metadata.textConfig.fontFamily" @change="saveMetadata(metadata)">
                            <option v-for="value in TextConfig.FONTS" :value="value">{{ value }}</option>
                        </select>
                    </div>
                    <div class="g-campo">
                        <label for="convertText">{{ $t('convertElementLabels') }}</label>
                        <select id="convertText" v-model="metadata.textConfig.convertMode" @change="saveMetadata(metadata)">
                            <option :value="null">{{ $t('dontConvertLabels') }}</option>
                            <option :value="TextConfig.CONVERT_MODE_UPPERCASE">{{ $t('convertToUppercasse') }}</option>
                            <option :value="TextConfig.CONVERT_MODE_LOWERCASE">{{ $t('convertToLowercase') }}</option>
                        </select>
                    </div>
                    <div class="g-campo">
                        <label for="fittingMode">{{ $t('modeForHandlingTooLongTexts') }}</label>
                        <select id="fittingMode" v-model="metadata.textConfig.fittingMode" @change="saveMetadata(metadata)">
                            <option :value="TextConfig.TOO_LONG_AUTO">{{ $t('adaptAutomatically') }}</option>
                            <option :value="TextConfig.TOO_LONG_TRUNCATE">{{ $t('truncate') }}</option>
                            <option :value="TextConfig.TOO_LONG_ELLIPSIS">{{ $t('ellipsisDotDotDot') }}</option>
                        </select>
                    </div>
                    <div class="g-campo">
                        <label for="maxLines">{{ $t('maximumNumberOfLines') }}</label>
                        <select id="maxLines" v-model="metadata.textConfig.maxLines" @change="saveMetadata(metadata)">
                            <option :value="1">1</option>
                            <option :value="2">2</option>
                            <option :value="3">3</option>
                        </select>
                    </div>
                    <div class="g-campo">
                        <label for="fontColor">{{ $t('fontColor') }}</label>
                        <div class="aj-cor">
                            <input id="fontColor" v-model="metadata.textConfig.fontColor" type="color" @change="saveMetadata(metadata)">
                            <button class="g-btn g-btn-leve" @click="metadata.textConfig.fontColor = constants.DEFAULT_ELEMENT_FONT_COLOR; saveMetadata(metadata)">{{ $t('ajustesRestaurar') }}</button>
                        </div>
                    </div>
                </div>
                <div class="aj-duas">
                    <ajuste-deslizar id="lineHeight" :label="$t('lineHeight')" min="1" max="3" step="0.1" decimals="1" v-model.number="metadata.textConfig.lineHeight" @change="saveMetadata(metadata)"/>
                    <ajuste-deslizar id="onlyTextLineHeight" :label="$t('onlyTextLineHeight')" min="1" max="3" step="0.1" decimals="1" v-model.number="metadata.textConfig.onlyTextLineHeight" @change="saveMetadata(metadata)"/>
                </div>
                <label class="g-marcar">
                    <input id="autoSizeKeyboardLetters" type="checkbox" v-model="metadata.textConfig.autoSizeKeyboardLetters" @change="saveMetadata(metadata)"/>
                    <span>{{ $t('autoSizeKeyboardLetters') }}</span>
                </label>

                <h3 class="aj-sub">{{ $t('ajustesAparenciaCoresBotoes') }}</h3>
                <div class="aj-duas">
                    <div class="g-campo">
                        <label for="elemColor">{{ $t('defaultGridElementColor') }}</label>
                        <div class="aj-cor">
                            <input id="elemColor" v-model="metadata.colorConfig.elementBackgroundColor" type="color" @change="saveMetadata(metadata)">
                            <button class="g-btn g-btn-leve" @click="metadata.colorConfig.elementBackgroundColor = constants.DEFAULT_ELEMENT_BACKGROUND_COLOR; saveMetadata(metadata)">{{ $t('ajustesRestaurar') }}</button>
                        </div>
                    </div>
                    <div class="g-campo">
                        <label for="borderColor">{{ $t('defaultGridElementBorderColor') }}</label>
                        <div class="aj-cor">
                            <input id="borderColor" v-model="metadata.colorConfig.elementBorderColor" type="color" @change="saveMetadata(metadata)">
                            <button class="g-btn g-btn-leve" @click="metadata.colorConfig.elementBorderColor = constants.DEFAULT_ELEMENT_BORDER_COLOR; saveMetadata(metadata)">{{ $t('ajustesRestaurar') }}</button>
                        </div>
                    </div>
                    <div class="g-campo">
                        <label for="appColor">{{ $t('defaultGridBackgroundColor') }}</label>
                        <div class="aj-cor">
                            <input id="appColor" v-model="metadata.colorConfig.gridBackgroundColor" type="color" @change="saveMetadata(metadata)">
                            <button class="g-btn g-btn-leve" @click="metadata.colorConfig.gridBackgroundColor = constants.DEFAULT_GRID_BACKGROUND_COLOR; saveMetadata(metadata)">{{ $t('ajustesRestaurar') }}</button>
                        </div>
                    </div>
                    <div class="g-campo">
                        <label for="colorMode">{{ $t('colorMode') }}</label>
                        <select id="colorMode" v-model="metadata.colorConfig.colorMode" @change="saveMetadata(metadata)">
                            <option :value="ColorConfig.COLOR_MODE_BACKGROUND">{{ $t('colorModeBackground') }}</option>
                            <option :value="ColorConfig.COLOR_MODE_BORDER">{{ $t('colorModeBorder') }}</option>
                            <option :value="ColorConfig.COLOR_MODE_BOTH">{{ $t('colorModeBackgroundBorder') }}</option>
                        </select>
                    </div>
                    <div class="g-campo">
                        <label for="colorScheme">{{ $t('colorSchemeForCategories') }}</label>
                        <select id="colorScheme" v-model="metadata.colorConfig.activeColorScheme" @change="saveMetadata(metadata)">
                            <option v-for="scheme in constants.DEFAULT_COLOR_SCHEMES" :value="scheme.name">{{ scheme.name | translate }}</option>
                        </select>
                        <div class="aj-faixa-cores" aria-hidden="true">
                            <span v-for="(color, index) in colorUtil.getActiveColorScheme(metadata).colors" :title="$t(colorUtil.getActiveColorScheme(metadata).categories[index])" :style="`background-color: ${color};`"></span>
                        </div>
                    </div>
                    <div class="g-campo">
                        <label for="firstRowHeightFactor">{{ $t('firstRowHeightFactor') }}</label>
                        <input id="firstRowHeightFactor" type="number" v-model.number="metadata.firstRowHeightFactor" min="0.1" max="5" step="0.1" @change="saveMetadata(metadata)"/>
                    </div>
                </div>
                <label class="g-marcar">
                    <input id="colorSchemeActive" type="checkbox" v-model="metadata.colorConfig.colorSchemesActivated" @change="saveMetadata(metadata)"/>
                    <span>{{ $t('activateColorCategoriesOfGridElements') }}</span>
                </label>
                <div class="aj-duas">
                    <ajuste-deslizar id="borderWidth" :label="$t('borderWidth')" unit="%" min="0" max="2" step="0.05" decimals="2" v-model.number="metadata.colorConfig.borderWidth" @change="saveMetadata(metadata)"/>
                    <ajuste-deslizar id="elementMargin" :label="$t('elementMargin')" unit="%" min="0" max="2" step="0.05" decimals="2" v-model.number="metadata.colorConfig.elementMargin" @change="saveMetadata(metadata)"/>
                    <ajuste-deslizar id="borderRadius" :label="$t('borderRadius')" unit="%" min="0" max="4" step="0.05" decimals="2" v-model.number="metadata.colorConfig.borderRadius" @change="saveMetadata(metadata)"/>
                </div>

                <div class="aj-restaurar">
                    <button class="g-btn g-btn-perigo" @click="toDefault"><i class="ti ti-restore" aria-hidden="true"></i>{{ $t('ajustesAparenciaPadrao') }}</button>
                </div>
            </div>
        </details>
    </div>
</template>

<script>
    import { TextConfig } from '../../../js/model/TextConfig';
    import { constants } from '../../../js/util/constants';
    import { settingsSaveMixin } from './settingsSaveMixin';
    import AjusteDeslizar from './ajusteDeslizar.vue';
    import AppGridDisplay from '../../grid-display/appGridDisplay.vue';
    import { GridElement } from '../../../js/model/GridElement';
    import { i18nService } from '../../../js/service/i18nService';
    import { GridImage } from '../../../js/model/GridImage';
    import { GridData } from '../../../js/model/GridData';
    import { util } from '../../../js/util/util';
    import { ColorConfig } from '../../../js/model/ColorConfig';
    import { colorUtil } from "../../../js/util/colorUtil";
    import { motionService } from '../../../js/service/motionService';

    /**
     * Ajustes > Aparência. Same fields as the old appearance tab (metadata.textConfig / metadata.colorConfig),
     * with the family choices first and the rest in "Mais opções".
     */
    export default {
        components: { AppGridDisplay, AjusteDeslizar },
        props: ["metadata", "userSettingsLocal"],
        mixins: [settingsSaveMixin],
        data() {
            return {
                TextConfig: TextConfig,
                ColorConfig: ColorConfig,
                colorUtil: colorUtil,
                constants: constants,
                testGridData: null,
                testElementLabel: i18nService.t("ajustesAparenciaPreviaTexto"),
                reduceMotion: motionService.isReduceMotionSetting(),
                systemReducesMotion: !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches),
                maisAberto: false
            }
        },
        computed: {
            griloColorsOn() {
                let colorConfig = this.metadata.colorConfig;
                return !!colorConfig.colorSchemesActivated && (colorConfig.activeColorScheme || '').startsWith(constants.COLOR_SCHEME_GRILO_PREFIX);
            },
            temaEscuro() {
                return this.metadata.colorConfig.elementBackgroundColor === constants.DEFAULT_ELEMENT_BACKGROUND_COLOR_DARK;
            }
        },
        methods: {
            setGriloColors(on) {
                if (on) {
                    this.metadata.colorConfig.colorSchemesActivated = true;
                    this.metadata.colorConfig.colorMode = ColorConfig.COLOR_MODE_BOTH;
                    this.metadata.colorConfig.borderWidth = ColorConfig.BORDER_WIDTH_BORDER_COLORED;
                    this.metadata.colorConfig.activeColorScheme = constants.COLOR_SCHEME_GRILO;
                } else {
                    this.metadata.colorConfig.colorSchemesActivated = false;
                }
                this.saveMetadata(this.metadata);
                this.resetTestGrid();
            },
            setReduceMotion() {
                motionService.setReduceMotionSetting(this.reduceMotion);
            },
            toDefault() {
                if (!window.confirm(this.$t('ajustesAparenciaPadraoConfirmar'))) {
                    return;
                }
                this.metadata.textConfig = JSON.parse(JSON.stringify(new TextConfig()));
                this.metadata.colorConfig = JSON.parse(JSON.stringify(new ColorConfig()));
                this.saveMetadata(this.metadata);
            },
            toDefaultBgColored() {
                this.metadata.colorConfig.colorMode = ColorConfig.COLOR_MODE_BACKGROUND;
                this.metadata.colorConfig.borderWidth = ColorConfig.BORDER_WIDTH_BG_COLORED;
                this.metadata.colorConfig.activeColorScheme = this.getColorScheme();
                this.saveMetadata(this.metadata);
            },
            toDefaultBorderColored() {
                this.metadata.colorConfig.colorMode = ColorConfig.COLOR_MODE_BORDER;
                this.metadata.colorConfig.borderWidth = ColorConfig.BORDER_WIDTH_BORDER_COLORED;
                this.metadata.colorConfig.activeColorScheme = this.getColorScheme();
                this.saveMetadata(this.metadata);
            },
            toDefaultBothColored() {
                this.metadata.colorConfig.colorMode = ColorConfig.COLOR_MODE_BOTH;
                this.metadata.colorConfig.borderWidth = ColorConfig.BORDER_WIDTH_BORDER_COLORED;
                this.metadata.colorConfig.activeColorScheme = this.getColorScheme();
                this.saveMetadata(this.metadata);
            },
            toDarkMode() {
                this.metadata.colorConfig.gridBackgroundColor = constants.DEFAULT_GRID_BACKGROUND_COLOR_DARK;
                this.metadata.colorConfig.elementBackgroundColor = constants.DEFAULT_ELEMENT_BACKGROUND_COLOR_DARK;
                this.metadata.textConfig.fontColor = constants.DEFAULT_ELEMENT_FONT_COLOR_DARK;
                this.metadata.colorConfig.activeColorScheme = this.getColorScheme();
                this.saveMetadata(this.metadata);
            },
            toLightMode() {
                this.metadata.colorConfig.gridBackgroundColor = constants.DEFAULT_GRID_BACKGROUND_COLOR;
                this.metadata.colorConfig.elementBackgroundColor = constants.DEFAULT_ELEMENT_BACKGROUND_COLOR;
                this.metadata.textConfig.fontColor = constants.DEFAULT_ELEMENT_FONT_COLOR;
                this.metadata.colorConfig.activeColorScheme = this.getColorScheme();
                this.saveMetadata(this.metadata);
            },
            getColorScheme() {
                let originalScheme = this.metadata.colorConfig.activeColorScheme || '';
                let borderColored = this.metadata.colorConfig.colorMode === ColorConfig.COLOR_MODE_BORDER;
                let backgroundColored = this.metadata.colorConfig.colorMode === ColorConfig.COLOR_MODE_BACKGROUND;
                let darkMode = this.metadata.colorConfig.elementBackgroundColor === constants.DEFAULT_ELEMENT_BACKGROUND_COLOR_DARK;
                if (originalScheme.startsWith(constants.COLOR_SCHEME_GRILO_PREFIX)) {
                    return borderColored ? constants.COLOR_SCHEME_GRILO_BORDER : constants.COLOR_SCHEME_GRILO;
                }
                if (originalScheme.startsWith(constants.COLOR_SCHEME_FITZGERALD_PREFIX)) {
                    if (backgroundColored) {
                        return darkMode ? constants.COLOR_SCHEME_FITZGERALD_DARK : constants.COLOR_SCHEME_FITZGERALD_LIGHT;
                    }
                    if (borderColored) {
                        return constants.COLOR_SCHEME_FITZGERALD_MEDIUM;
                    }
                    return darkMode ? constants.COLOR_SCHEME_FITZGERALD_DARK : constants.COLOR_SCHEME_FITZGERALD_VERY_LIGHT;
                } else if (originalScheme.startsWith(constants.COLOR_SCHEME_GOOSENS_PREFIX)) {
                    if (backgroundColored) {
                        return darkMode ? constants.COLOR_SCHEME_GOOSENS_DARK : constants.COLOR_SCHEME_GOOSENS_LIGHT;
                    }
                    if (borderColored) {
                        return constants.COLOR_SCHEME_GOOSENS_MEDIUM;
                    }
                    return darkMode ? constants.COLOR_SCHEME_GOOSENS_DARK : constants.COLOR_SCHEME_GOOSENS_VERY_LIGHT;
                } else if (originalScheme.startsWith(constants.COLOR_SCHEME_MONTESSORI_PREFIX)) {
                    if (backgroundColored) {
                        return darkMode ? constants.COLOR_SCHEME_MONTESSORI_DARK : constants.COLOR_SCHEME_MONTESSORI_LIGHT;
                    }
                    if (borderColored) {
                        return constants.COLOR_SCHEME_MONTESSORI_MEDIUM;
                    }
                    return darkMode ? constants.COLOR_SCHEME_MONTESSORI_DARK : constants.COLOR_SCHEME_MONTESSORI_VERY_LIGHT;
                }
                return this.metadata.colorConfig.activeColorScheme;
            },
            getElement(x, y, label, imgUrl, colorCategory) {
                return new GridElement({
                    x: x,
                    y: y,
                    label: i18nService.getTranslationObject(label),
                    image: new GridImage({ url: imgUrl }),
                    colorCategory: colorCategory
                });
            },
            resetTestGrid() {
                util.debounce(() => {
                    this.testGridData = new GridData({
                        rowCount: 2,
                        minColumnCount: 2,
                        gridElements: [
                            this.getElement(0, 0, this.testElementLabel, "https://api.arasaac.org/api/pictograms/2648?download=false&plural=false&color=true"),
                            this.getElement(1, 0, i18nService.t("CC_VERB"), "https://api.arasaac.org/api/pictograms/4887?download=false&plural=false&color=true", "CC_VERB"),
                            this.getElement(0, 1, i18nService.t("CC_NOUN"), "https://api.arasaac.org/api/pictograms/2808?download=false&plural=false&color=true", "CC_NOUN"),
                            this.getElement(1, 1, this.testElementLabel)
                        ]
                    });
                }, 200, "RESET_TEST_GRD");
            }
        },
        async mounted() {
            this.resetTestGrid();
        }
    }
</script>

<style scoped>
    .aj-aparencia-grade {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 280px;
        gap: var(--g-e5);
        align-items: start;
    }
    @media (max-width: 860px) {
        .aj-aparencia-grade { grid-template-columns: minmax(0, 1fr); }
    }
    .aj-previa {
        background: var(--g-superficie-2);
        border-radius: var(--g-raio);
        padding: var(--g-e4);
        position: sticky;
        top: 140px;
    }
    @media (max-width: 860px) {
        .aj-previa { position: static; }
    }
    .aj-previa-prancha {
        height: 300px;
        display: flex;
        flex-direction: column;
        border-radius: var(--g-raio-p);
        overflow: hidden;
        position: relative;
    }
    .aj-legenda {
        list-style: none;
        display: flex;
        flex-wrap: wrap;
        gap: var(--g-e2);
        margin: 0 0 var(--g-e4);
        padding: 0;
    }
    .aj-legenda li {
        margin: 0;
        padding: 2px 10px;
        border: 3px solid;
        border-radius: var(--g-raio-p);
        color: var(--g-tinta);
        font-size: var(--g-t-legenda);
        font-weight: 700;
    }
    .aj-amostra {
        width: 22px;
        height: 22px;
        border-radius: 6px;
        flex: none;
    }
    .aj-amostra-fundo { background: var(--g-girassol-claro); border: 2px solid var(--g-borda); }
    .aj-amostra-borda { background: var(--g-superficie); border: 4px solid var(--g-girassol); }
    .aj-amostra-ambos { background: var(--g-girassol-claro); border: 4px solid var(--g-girassol); }
    .aj-cor {
        display: flex;
        gap: var(--g-e3);
        align-items: center;
    }
    .aj-cor input[type="color"] {
        width: 72px;
        min-height: var(--g-alvo);
        padding: 4px;
        border: 2px solid var(--g-borda);
        border-radius: var(--g-raio-p);
        background: var(--g-superficie);
        cursor: pointer;
        margin: 0;
    }
    .aj-faixa-cores {
        display: flex;
        height: 20px;
        border-radius: 6px;
        overflow: hidden;
        margin-top: var(--g-e2);
    }
    .aj-faixa-cores span { flex: 1; }
    .aj-restaurar { margin-top: var(--g-e4); }
</style>
