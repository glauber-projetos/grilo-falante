<template>
    <div class="elv">
        <p class="g-apoio elv-intro"><i class="ti ti-activity" aria-hidden="true"></i>{{ $t('gestaoBotaoAoVivoIntro') }}</p>
        <div class="g-campo">
            <label for="mode">{{ $t('gestaoBotaoAoVivoOQue') }}</label>
            <select id="mode" v-model="gridElement.mode">
                <option :value="undefined" disabled selected hidden="">{{ $t('gestaoBotaoEscolha') }}</option>
                <option v-for="mode in GridElementLive.MODES" :value="mode">{{ mode | translate }}</option>
            </select>
        </div>

        <template v-if="gridElement.mode === GridElementLive.MODE_DATETIME">
            <div class="g-campo">
                <label for="dt_format">{{ $t('gestaoBotaoAoVivoFormatoData') }}</label>
                <select id="dt_format" v-model="gridElement.dateTimeFormat">
                    <option :value="undefined" disabled selected hidden="">{{ $t('gestaoBotaoEscolha') }}</option>
                    <option v-for="format in GridElementLive.DT_FORMATS" :value="format">{{ $t(format) }} - [{{ currentDtValues[format] }}]</option>
                </select>
            </div>
            <div class="gm-grade">
                <div class="g-campo">
                    <label for="dt_locale">{{ $t('gestaoBotaoIdioma') }}</label>
                    <select id="dt_locale" v-model="gridElement.dateTimeLocale" @change="recalcDtValues">
                        <option :value="undefined">{{ $t('gestaoBotaoAutomatico') }}</option>
                        <option v-for="lang in allLanguages" :value="lang.code">{{lang | extractTranslationAppLang}} ({{lang.code}})</option>
                    </select>
                </div>
                <div class="g-campo">
                    <label for="offsetHours">{{ $t('gestaoBotaoAoVivoFuso') }}</label>
                    <input id="offsetHours" type="number" v-model.number="gridElement.dateTimeOffsetHours" @input="recalcDtValues(300)"/>
                    <span class="g-dica">{{ $t('gestaoBotaoAoVivoFusoDica') }}</span>
                </div>
            </div>
            <div class="g-campo" v-if="gridElement.dateTimeFormat === GridElementLive.DT_FORMAT_CUSTOM">
                <label for="dt_format_custom">{{ $t('gestaoBotaoAoVivoFormatoProprio') }}</label>
                <input id="dt_format_custom" type="text" v-model="gridElement.dateTimeFormatCustom" placeholder="EEEE, dd. MMMM yyyy, HH:mm" @input="recalcDtValues(300)" autocomplete="off"/>
                <span class="g-dica">{{ $t('gestaoBotaoVejaComo') }}: <a target="_blank" rel="noopener" href="https://date-fns.org/v4.1.0/docs/format">date-fns.org</a></span>
            </div>
        </template>

        <div class="g-campo" v-if="gridElement.mode === GridElementLive.MODE_APP_STATE">
            <label for="appState">{{ $t('MODE_APP_STATE') }}</label>
            <select id="appState" v-model="gridElement.appState">
                <option :value="undefined" disabled selected hidden="">{{ $t('gestaoBotaoEscolha') }}</option>
                <option v-for="state in GridElementLive.APP_STATES" :value="state">{{ state | translate }}</option>
            </select>
        </div>
        <div class="g-campo" v-if="gridElement.mode === GridElementLive.MODE_RANDOM">
            <label for="valuesToChooseFrom">{{ $t('gestaoBotaoAoVivoValores') }}</label>
            <input id="valuesToChooseFrom" type="text" v-model="gridElement.chooseValues" :placeholder="$t('egChooseValues')" autocomplete="off"/>
        </div>
        <div class="g-campo" v-if="gridElement.mode === GridElementLive.MODE_PODCAST_STATE">
            <label for="podcastState">{{ $t('MODE_PODCAST_STATE') }}</label>
            <select id="podcastState" v-model="gridElement.state">
                <option :value="undefined" disabled selected hidden="">{{ $t('gestaoBotaoEscolha') }}</option>
                <option v-for="state in GridElementLive.PODCAST_STATES" :value="state">{{ state | translate }}</option>
            </select>
        </div>
        <div class="g-campo" v-if="[GridElementLive.MODE_ACTION_RESULT, GridElementLive.MODE_RANDOM].includes(gridElement.mode)">
            <label for="updateInterval">{{ $t('gestaoBotaoAoVivoAtualizar') }}</label>
            <input id="updateInterval" type="number" v-model.number="gridElement.updateSeconds" :placeholder="$t('gestaoBotaoOpcional')"/>
            <span class="g-dica">{{ $t('gestaoBotaoAoVivoAtualizarDica') }}</span>
        </div>

        <template v-if="gridElement.mode === GridElementLive.MODE_ACTION_RESULT">
            <div class="g-campo">
                <label for="actionType">{{ $t('gestaoBotaoAoVivoDeOnde') }}</label>
                <select id="actionType" v-model="actionType" @change="actionTypeChanged">
                    <option :value="undefined" disabled selected hidden="">{{ $t('gestaoBotaoEscolha') }}</option>
                    <option v-for="type in possibleActionTypes" :value="type">{{ type | translate }}</option>
                </select>
            </div>
            <section class="gm-secao" v-if="gridElement.liveAction">
                <h3><i class="ti ti-settings" aria-hidden="true"></i>{{ gridElement.liveAction.modelName | translate }}</h3>
                <edit-action :action="gridElement.liveAction" @change="liveActionChanged"/>
            </section>
            <template v-if="gridElement.liveAction">
                <div class="g-campo" v-if="gridElement.liveAction.modelName === GridActionPredefined.getModelName()">
                    <label for="extractInfo">{{ $t('gestaoBotaoAoVivoMostrar') }}</label>
                    <select id="extractInfo" v-model="extractInfo" @change="extractInfoChanged">
                        <option :value="undefined" disabled selected hidden="">{{ $t('gestaoBotaoEscolha') }}</option>
                        <option v-for="info in extractInfos" :value="info">{{i18nService.tPredefined(info.name)}}</option>
                    </select>
                </div>
                <details class="gm-avancado" v-if="gridElement.liveAction.modelName === GridActionHTTP.getModelName()">
                    <summary>{{ $t('gestaoBotaoAoVivoTirarDados') }}</summary>
                    <div class="gm-avancado-corpo">
                        <div class="g-campo">
                            <label for="extractMode">{{ $t('extractMode') }}</label>
                            <select id="extractMode" v-model="gridElement.extractMode">
                                <option v-for="mode in GridElementLive.EXTRACT_MODES" :value="mode">{{ mode | translate }}</option>
                            </select>
                        </div>
                        <div class="g-campo" v-if="gridElement.extractMode === GridElementLive.EXTRACT_JSON">
                            <label for="extractJson">{{ $t('jsonPath') }}</label>
                            <input id="extractJson" type="text" v-model="gridElement.extractSelector" autocomplete="off"/>
                            <span class="g-dica">{{ $t('egJsonPath') }}</span>
                        </div>
                        <template v-if="gridElement.extractMode === GridElementLive.EXTRACT_HTML_SELECTOR">
                            <div class="g-campo">
                                <label for="extractCss">{{ $t('cssSelector') }}</label>
                                <input id="extractCss" type="text" v-model="gridElement.extractSelector" autocomplete="off"/>
                                <span class="g-dica">{{ $t('egCssSelector') }}</span>
                            </div>
                            <div class="g-campo">
                                <label for="elementIndex">{{ $t('elementIndex') }}</label>
                                <input id="elementIndex" type="number" v-model.number="gridElement.extractIndex"/>
                                <span class="g-dica">{{ $t('egElementIndex') }}</span>
                            </div>
                        </template>
                    </div>
                </details>
                <div class="g-linha elv-teste">
                    <button type="button" class="g-btn" @click="test"><i class="ti ti-bolt" aria-hidden="true"></i>{{ $t('gestaoBotaoTestar') }}</button>
                    <output v-if="result !== ''" class="elv-resultado" for="actionType">{{ result }}</output>
                </div>
            </template>
        </template>
    </div>
</template>

<script>
    import './../../css/modal.css';
    import {GridElement} from "../../js/model/GridElement.js";
    import { GridElementLive } from '../../js/model/GridElementLive';
    import { liveElementService } from '../../js/service/liveElementService';
    import { GridActionHTTP } from '../../js/model/GridActionHTTP';
    import { GridActionPredefined } from '../../js/model/GridActionPredefined';
    import EditAction from './editAction.vue';
    import { i18nService } from '../../js/service/i18nService';
    import { util } from '../../js/util/util';

    export default {
        components: { EditAction },
        props: ['gridElement'],
        data: function () {
            return {
                GridElementLive: GridElementLive,
                liveElementService: liveElementService,
                possibleActionTypes: [GridActionPredefined.getModelName(), GridActionHTTP.getModelName()],
                actionType: undefined,
                result: '',
                extractInfo: undefined,
                GridActionHTTP: GridActionHTTP,
                GridActionPredefined: GridActionPredefined,
                updateCounter: 0,
                i18nService: i18nService,
                currentDtValues: {},
                allLanguages: i18nService.getAllLanguages()
            }
        },
        computed: {
            extractInfos() {
                this.updateCounter--;
                let action = this.gridElement.liveAction;
                if(!action || !action.actionInfo || !action.actionInfo.extract) {
                    return [];
                }
                return action.actionInfo.extract.extractInfos || [];
            },
            extractMode() {
                let action = this.gridElement.liveAction;
                if(!action || !action.actionInfo || !action.actionInfo.extract) {
                    return undefined;
                }
                return action.actionInfo.extract.mode || undefined;
            },
            extractInfoBasedOnCurrent() {
                if (!this.gridElement || !this.gridElement.liveAction || !this.gridElement.liveAction.actionInfo ||
                    !this.gridElement.liveAction.actionInfo.extract ||
                    !this.gridElement.liveAction.modelName === GridActionPredefined.getModelName()) {
                    return undefined;
                }
                let infos = this.gridElement.liveAction.actionInfo.extract.extractInfos;
                return infos.find(i => i.selector === this.gridElement.extractSelector) || undefined;
            }
        },
        methods: {
            actionTypeChanged() {
                this.gridElement.liveAction = GridElement.getActionInstance(this.actionType);
                this.gridElement.liveAction.isLiveAction = true;
            },
            async test() {
                this.result = await liveElementService.getCurrentValue(this.gridElement, {forceUpdate: true});
            },
            extractInfoChanged() {
                this.gridElement.extractMode = this.extractMode;
                this.gridElement.extractSelector = this.extractInfo.selector;
                this.gridElement.extractMappings = this.extractInfo.mappings;
            },
            liveActionChanged() {
                this.updateCounter++;
                this.extractInfo = undefined;
                this.$nextTick(() => {
                    if (this.extractInfos.length === 1) {
                        this.extractInfo = this.extractInfos[0];
                        this.extractInfoChanged();
                    }
                });
            },
            recalcDtValues(debounceMs = 0) {
                util.debounce(async () => {
                    for (let format of GridElementLive.DT_FORMATS) {
                        this.$set(this.currentDtValues, format, await liveElementService.getCurrentValue( {
                            mode: GridElementLive.MODE_DATETIME,
                            dateTimeFormat: format,
                            dateTimeLocale: this.gridElement.dateTimeLocale,
                            dateTimeFormatCustom: this.gridElement.dateTimeFormatCustom,
                            dateTimeOffsetHours: this.gridElement.dateTimeOffsetHours
                        }));
                    }
                }, debounceMs);
            }
        },
        async mounted() {
            this.gridElement.additionalProps[GridElement.PROP_YT_PREVENT_CLICK] = this.gridElement.additionalProps[GridElement.PROP_YT_PREVENT_CLICK] || false;
            this.actionType = this.gridElement.liveAction ? this.gridElement.liveAction.modelName : undefined;
            this.extractInfo = this.extractInfoBasedOnCurrent;
            this.recalcDtValues();
        },
        beforeDestroy() {
        }
    }
</script>

<style scoped>
.elv-intro { display: flex; align-items: flex-start; gap: var(--g-e2); margin: 0 0 var(--g-e4); }
.elv-intro .ti { font-size: 1.4em; color: var(--g-folha-escura); flex: none; }
.elv-teste { margin-top: var(--g-e4); }
.elv-resultado {
    flex: 1 1 200px; min-width: 0; min-height: var(--g-alvo);
    display: flex; align-items: center;
    padding: var(--g-e2) var(--g-e3); border-radius: var(--g-raio);
    background: var(--g-folha-clara); color: var(--g-folha-escura); font-weight: 700; overflow-wrap: anywhere;
}
</style>
