<template>
<div class="ac">
    <div v-if="action.modelName == 'GridActionSpeak'">
        <p class="ac-explica"><i class="ti ti-volume" aria-hidden="true"></i><span>{{ $t('gestaoAcaoExplicaFala') }}</span></p>
        <details class="gm-avancado">
            <summary>{{ $t('gestaoMaisOpcoes') }}</summary>
            <div class="gm-avancado-corpo">
                <div class="g-campo">
                    <label for="selectLang">{{ $t('gestaoAcaoIdiomaFala') }}</label>
                    <select id="selectLang" v-model="action.speakLanguage">
                        <option :value="undefined">{{ $t('automaticCurrentLanguage') }}</option>
                        <option v-for="lang in voiceLangs" :value="lang.code">
                            {{lang | extractTranslation}}
                        </option>
                    </select>
                    <span class="g-dica" v-if="action.speakLanguage && gridElement">
                        {{ $t('gestaoAcaoTextoNesseIdioma', [$t('lang.' + action.speakLanguage)]) }} {{gridElement.label[action.speakLanguage]}}
                    </span>
                </div>
            </div>
        </details>
    </div>
    <div v-if="action.modelName == 'GridActionSpeakCustom'">
        <div class="g-campo">
            <label for="inCustomText">{{ $t('gestaoAcaoTextoFalar') }}</label>
            <input id="inCustomText" type="text" v-model="action.speakText[getCurrentSpeakLang(action)]" :placeholder="gridElement && gridElement.type === GridElement.ELEMENT_TYPE_LIVE ? $t('canIncludePlaceholderLike') : ''"/>
            <span class="g-dica">{{ $t('gestaoAcaoTextoFalarDica') }}</span>
        </div>
        <details class="gm-avancado">
            <summary>{{ $t('gestaoMaisOpcoes') }}</summary>
            <div class="gm-avancado-corpo">
                <div class="g-campo">
                    <label for="selectLang2">{{ $t('gestaoAcaoIdiomaFala') }}</label>
                    <select id="selectLang2" v-model="action.speakLanguage">
                        <option :value="undefined">{{ $t('automaticCurrentLanguage') }}</option>
                        <option v-for="lang in voiceLangs" :value="lang.code">
                            {{lang | extractTranslation}}
                        </option>
                    </select>
                </div>
            </div>
        </details>
    </div>
    <div v-if="action.modelName == 'GridActionAudio'">
        <edit-audio-action :action="action" :grid-data="gridData"></edit-audio-action>
    </div>
    <div v-if="action.modelName == 'GridActionWordForm'">
        <edit-word-form-action :action="action" :grid-data="gridData"></edit-word-form-action>
    </div>
    <div v-if="action.modelName == 'GridActionNavigate'">
        <fieldset class="ac-grupo">
            <legend class="ac-legenda">{{ $t('gestaoAcaoParaOnde') }}</legend>
            <div class="gm-escolhas ac-escolhas">
                <button v-for="type in Object.values(GridActionNavigate.NAV_TYPES)" :key="type" type="button" class="gm-escolha"
                        :aria-pressed="(action.navType === type).toString()" @click="action.navType = type">
                    <i :class="'ti ti-' + (iconesNavegacao[type] || 'arrow-right')" aria-hidden="true"></i>
                    <span>{{ nomesNavegacao[type] }}</span>
                </button>
            </div>
        </fieldset>
        <div class="g-campo" v-if="action.navType === GridActionNavigate.NAV_TYPES.TO_GRID">
            <label for="selectGrid">{{ $t('gestaoAcaoQualPrancha') }}</label>
            <select id="selectGrid" v-model="action.toGridId">
                <option v-for="grid in grids" :value="grid.id">
                    {{grid.label | extractTranslation}}
                </option>
            </select>
        </div>
        <div v-if="action.navType === GridActionNavigate.NAV_TYPES.OPEN_SEARCH">
            <div class="g-campo">
                <label for="searchTextInput">{{ $t('gestaoAcaoBuscarTexto') }}</label>
                <input id="searchTextInput" type="text" v-model="action.searchText" :placeholder="$t('customText')"/>
            </div>
            <label class="g-marcar">
                <input id="searchCollected" type="checkbox" v-model="action.searchCollectedText"/>
                <span>{{ $t('gestaoAcaoBuscarFrase') }}</span>
            </label>
        </div>
        <details class="gm-avancado">
            <summary>{{ $t('gestaoMaisOpcoes') }}</summary>
            <div class="gm-avancado-corpo">
                <label class="g-marcar">
                    <input id="addToCollectChk" type="checkbox" v-model="action.addToCollectElem"/>
                    <span>{{ $t('gestaoAcaoJuntarMesmoNavegando') }}</span>
                </label>
            </div>
        </details>
    </div>
    <div v-if="action.modelName === 'GridActionARE'">
        <edit-are-action :action="action" :grid-data="gridData"/>
    </div>
    <div v-if="action.modelName === 'GridActionOpenHAB'">
        <edit-open-hab-action :action="action" :grid-data="gridData"/>
    </div>
    <div v-if="action.modelName === 'GridActionHTTP'">
      <edit-http-action :action="action"/>
    </div>
    <div v-if="action.modelName === 'GridActionPredefined'">
        <edit-predefined-action :action="action" :grid-data="gridData" v-on="$listeners"/>
    </div>
    <div v-if="action.modelName === 'GridActionMatrix'">
        <edit-matrix-action :action="action"/>
    </div>
    <div v-if="action.modelName == 'GridActionPredict'">
        <div class="g-campo">
            <label for="comboUseDict">{{ $t('gestaoAcaoPalavrasSugestao') }}</label>
            <select id="comboUseDict" v-model="action.dictionaryKey">
                <option :value="null">{{ $t('allDictionaries') }}</option>
                <option :value="GridActionPredict.USE_DICTIONARY_CURRENT_LANG">{{ $t('useDictionaryOfCurrentContentLanguage') }}</option>
                <option v-for="id in dictionaryKeys" :value="id">
                    {{id}}
                </option>
            </select>
        </div>
        <label class="g-marcar" v-show="gridElement && gridElement.type === GridElement.ELEMENT_TYPE_COLLECT">
            <input id="chkSuggestOnChange" type="checkbox" v-model="action.suggestOnChange"/>
            <span>{{ $t('refreshSuggestionsOnChange') }}</span>
        </label>
    </div>
    <div v-if="action.modelName == 'GridActionCollectElement'">
        <div class="g-campo">
            <label for="selectCollectElmAction">{{ $t('gestaoAcaoOQueFazerFrase') }}</label>
            <select id="selectCollectElmAction" v-model="action.action">
                <option v-for="elmAction in collectActions" :value="elmAction">
                    {{elmAction | translate}}
                </option>
            </select>
            <span class="g-dica">{{ $t('gestaoAcaoFraseDica') }}</span>
        </div>
    </div>
    <div v-if="action.modelName == 'GridActionWebradio'">
        <div class="gm-grade">
            <div class="g-campo">
                <label for="selectRadioElmAction">{{ $t('gestaoAcaoOQueFazerRadio') }}</label>
                <select id="selectRadioElmAction" v-model="action.action">
                    <option v-for="elmAction in webradioActions" :value="elmAction">
                        {{elmAction | translate}}
                    </option>
                </select>
            </div>
            <div class="g-campo" v-show="action.action === 'WEBRADIO_ACTION_START' || action.action === 'WEBRADIO_ACTION_TOGGLE'">
                <label for="selectRadio">{{ $t('gestaoAcaoQualRadio') }}</label>
                <select id="selectRadio" v-model="action.radioId" @change="selectedRadioChanged(action.radioId)">
                    <option value="" selected>{{ $t('automaticLastPlayed') }}</option>
                    <option v-for="webradio in gridData.webRadios" :value="webradio.radioId">
                        {{webradio.radioName}}
                    </option>
                </select>
            </div>
        </div>
        <details class="gm-avancado" :open="gridData.webRadios.length === 0">
            <summary>{{ $t('gestaoAcaoEscolherRadios') }}</summary>
            <div class="gm-avancado-corpo">
                <radio-list-selector :grid-data="gridData"></radio-list-selector>
            </div>
        </details>
    </div>
    <div v-if="action.modelName == 'GridActionPodcast'">
        <edit-podcast-action :action="action" :grid-data="gridData"></edit-podcast-action>
    </div>
    <div v-if="action.modelName === 'GridActionYoutube'">
        <div class="gm-grade">
            <div class="g-campo">
                <label for="ytActions">{{ $t('gestaoAcaoOQueFazerVideo') }}</label>
                <select id="ytActions" v-model="action.action">
                    <option v-for="elmAction in GridActionYoutube.actions" :value="elmAction">
                        {{elmAction | translate}}
                    </option>
                </select>
            </div>
            <div class="g-campo" v-show="[GridActionYoutube.actions.YT_PLAY, GridActionYoutube.actions.YT_TOGGLE, GridActionYoutube.actions.YT_RESTART].indexOf(action.action) !== -1">
                <label for="ytPlayType">{{ $t('gestaoAcaoTipoVideo') }}</label>
                <select id="ytPlayType" v-model="action.playType">
                    <option v-for="playType in Object.keys(GridActionYoutube.playTypes).filter(t => t !== GridActionYoutube.playTypes.YT_PLAY_RELATED)" :value="playType">{{playType | translate}}</option>
                </select>
            </div>
        </div>
        <div v-show="action.playType && [GridActionYoutube.actions.YT_PLAY, GridActionYoutube.actions.YT_TOGGLE, GridActionYoutube.actions.YT_RESTART].indexOf(action.action) !== -1">
            <div class="g-campo" v-show="action.playType !== GridActionYoutube.playTypes.YT_PLAY_RELATED">
                <label for="ytList">
                    <span v-show="action.playType === GridActionYoutube.playTypes.YT_PLAY_VIDEO">{{ $t('videoLink') }}</span>
                    <span v-show="action.playType === GridActionYoutube.playTypes.YT_PLAY_SEARCH">{{ $t('youtubeSearchQuery') }}</span>
                    <span v-show="action.playType === GridActionYoutube.playTypes.YT_PLAY_PLAYLIST">{{ $t('youtubePlaylistLink') }}</span>
                    <span v-show="action.playType === GridActionYoutube.playTypes.YT_PLAY_CHANNEL">{{ $t('youtubeChannelLinkOrId') }}</span>
                </label>
                <input id="ytList" type="text" v-model="action.data"/>
            </div>
            <details class="gm-avancado">
                <summary>{{ $t('gestaoMaisOpcoes') }}</summary>
                <div class="gm-avancado-corpo">
                    <label class="g-marcar">
                        <input id="showCC" type="checkbox" v-model="action.showCC"/>
                        <span>{{ $t('showVideoSubtitlesIfAvailable') }}</span>
                    </label>
                    <label class="g-marcar">
                        <input id="playMuted" type="checkbox" v-model="action.playMuted"/>
                        <span>{{ $t('startVideoMuted') }}</span>
                    </label>
                    <label class="g-marcar">
                        <input id="afterNav" type="checkbox" v-model="action.performAfterNav"/>
                        <span>{{ $t('performActionAfterNavigation') }}</span>
                    </label>
                </div>
            </details>
        </div>
        <div class="g-campo" v-show="[GridActionYoutube.actions.YT_STEP_FORWARD, GridActionYoutube.actions.YT_STEP_BACKWARD].indexOf(action.action) !== -1">
            <label for="stepSeconds">{{ $t(action.action) }} {{ $t('secondsBracket') }}</label>
            <input id="stepSeconds" type="number" v-model="action.stepSeconds" min="0"/>
        </div>
        <div class="g-campo" v-show="[GridActionYoutube.actions.YT_VOLUME_UP, GridActionYoutube.actions.YT_VOLUME_DOWN].indexOf(action.action) !== -1">
            <label for="stepVolume">{{ $t(action.action) }} {{ $t('percentBracket') }}</label>
            <input id="stepVolume" type="number" v-model="action.stepVolume" min="0" max="100"/>
        </div>
    </div>
    <div v-if="action.modelName === 'GridActionChangeLang'">
        <div class="gm-grade">
            <div>
                <div class="g-campo">
                    <label for="changeLang">{{ $t('gestaoAcaoTrocarIdiomaPara') }}</label>
                    <select id="changeLang" v-model="action.language">
                        <option :value="undefined">{{ $t('systemLanguage') }}</option>
                        <option :value="GridActionChangeLang.LAST_LANG">{{ $t(GridActionChangeLang.LAST_LANG) }}</option>
                        <option v-for="lang in allLanguages" :value="lang.code" v-show="selectFromAllLanguages || lang.code === action.language || gridLanguageCodes.includes(lang.code)">
                            {{lang | extractTranslation}}
                        </option>
                    </select>
                </div>
                <label class="g-marcar ac-marcar-junto">
                    <input id="selectFromAllLangs" type="checkbox" v-model="selectFromAllLanguages"/>
                    <span>{{ $t('showAllLanguages') }}</span>
                </label>
            </div>
            <div>
                <div class="g-campo">
                    <label for="changeVoice">{{ $t('gestaoAcaoTrocarVozPara') }}</label>
                    <select id="changeVoice" v-model="action.voice">
                        <option :value="undefined">{{ $t('automatic') }}</option>
                        <option v-for="voice in allVoices" :value="voice.id" v-show="selectFromAllVoices || !action.language || i18nService.getBaseLang(voice.lang) === i18nService.getBaseLang(action.language)">
                            <span v-if="!selectFromAllVoices && action.language">{{voice.name}}, {{voice.local ? $t('offline') : $t('online')}}</span>
                            <span v-if="selectFromAllVoices || !action.language">{{ $t(`lang.${voice.lang}`) }}: {{voice.name}}, {{voice.local ? $t('offline') : $t('online')}}</span>
                        </option>
                    </select>
                </div>
                <label class="g-marcar ac-marcar-junto">
                    <input id="selectAllVoices" type="checkbox" v-model="selectFromAllVoices"/>
                    <span>{{ $t('showAllVoices') }}</span>
                </label>
            </div>
        </div>
        <button type="button" id="testVoice2" class="g-btn" :disabled="!action.voice" @click="speechService.testSpeak(action.voice, null, action.language)">
            <i class="ti ti-volume" aria-hidden="true"></i><span>{{ $t('testVoice') }}</span>
        </button>
    </div>
    <div v-if="action.modelName === 'GridActionVocabLevelToggle'">
        <div class="g-campo">
            <label for="vocabLevelMode">{{ $t('gestaoAcaoOQueFazer') }}</label>
            <select id="vocabLevelMode" v-model="action.mode">
                <option v-for="mode in GridActionVocabLevelToggle.getModes()" :value="GridActionVocabLevelToggle.modes[mode]">{{ mode | translate }}</option>
            </select>
        </div>
        <p class="g-aviso"><i class="ti ti-info-circle" aria-hidden="true"></i><span>{{ $t('vocabLevelToggleDescription') }}</span></p>
    </div>
    <div v-if="action.modelName === 'GridActionOpenWebpage'">
        <div class="g-campo">
            <label for="openUrl">{{ $t('gestaoAcaoEnderecoPagina') }}</label>
            <input id="openUrl" type="text" inputmode="url" spellcheck="false" v-model="action.openURL" placeholder="https://"/>
            <span class="g-dica">{{ $t('gestaoAcaoEnderecoPaginaDica') }}</span>
        </div>
        <details class="gm-avancado">
            <summary>{{ $t('gestaoMaisOpcoes') }}</summary>
            <div class="gm-avancado-corpo">
                <div class="g-campo">
                    <label for="webpageCloseTimeout">{{ $t('gestaoAcaoFecharPaginaApos') }}</label>
                    <input id="webpageCloseTimeout" type="number" min="0" v-model="action.timeoutSeconds"/>
                    <span class="g-dica">{{ $t('gestaoAcaoFecharPaginaDica') }}</span>
                </div>
            </div>
        </details>
    </div>
    <div v-if="action.modelName === GridActionUART.getModelName()">
        <div class="g-campo">
            <label for="uartType">{{ $t('gestaoAcaoTipoConexao') }}</label>
            <select id="uartType" v-model="action.connectionType">
                <option v-for="type in GridActionUART.CONN_TYPES" :value="type">{{ type | translate}}</option>
            </select>
        </div>
        <div class="g-campo">
            <label for="uartCmd">{{ $t('gestaoAcaoComandoEnviar') }}</label>
            <textarea id="uartCmd" v-model="action.data" rows="2"
                      placeholder="LED1.set(); or AT MX 10" spellcheck="false" type="text"/>
        </div>
    </div>
    <div v-if="action.modelName === GridActionSystem.getModelName()">
        <div class="gm-grade">
            <div class="g-campo">
                <label for="systemActionType">{{ $t('gestaoAcaoOQueFazer') }}</label>
                <select id="systemActionType" v-model="action.action" @change="action.actionValue = action.action === GridActionSystem.actions.SYS_UPDATE_LIVE_ELEMENTS ? 0 : 10">
                    <option v-for="action in GridActionSystem.actions" :value="action">{{ action | translate}}</option>
                </select>
            </div>
            <div class="g-campo" v-if="[GridActionSystem.actions.SYS_VOLUME_UP, GridActionSystem.actions.SYS_VOLUME_DOWN].includes(action.action)">
                <label for="systemActionValue">{{ $t(action.action) }} {{ $t('percentBracket') }}</label>
                <input id="systemActionValue" type="number" min="0" max="100" v-model.number="action.actionValue"/>
            </div>
            <div class="g-campo" v-if="[GridActionSystem.actions.SYS_UPDATE_LIVE_ELEMENTS].includes(action.action)">
                <label for="systemActionDelay">{{ $t('delayMs') }}</label>
                <input id="systemActionDelay" type="number" min="0" v-model.number="action.actionValue"/>
            </div>
        </div>
    </div>
</div>
</template>

<script>
    import {speechService} from './../../js/service/speechService'
    import {predictionService} from "../../js/service/predictionService";
    import {i18nService} from "../../js/service/i18nService";
    import {GridActionNavigate} from "../../js/model/GridActionNavigate";
    import './../../css/modal.css';
    import {GridElement} from "../../js/model/GridElement";
    import EditAreAction from "./editActionsSub/editAREAction.vue";
    import EditOpenHabAction from "./editActionsSub/editOpenHABAction.vue";
    import {GridActionCollectElement} from "../../js/model/GridActionCollectElement";
    import {GridActionWebradio} from "../../js/model/GridActionWebradio";
    import {imageUtil} from "../../js/util/imageUtil";
    import {GridImage} from "../../js/model/GridImage";
    import RadioListSelector from "../components/radioListSelector.vue";
    import {GridActionYoutube} from "../../js/model/GridActionYoutube";
    import EditAudioAction from "./editActionsSub/editAudioAction.vue";
    import EditWordFormAction from "./editActionsSub/editWordFormAction.vue";
    import EditHttpAction from "./editActionsSub/editHttpAction.vue";
    import {GridActionUART} from "../../js/model/GridActionUART.js";
    import { GridActionPredict } from '../../js/model/GridActionPredict';
    import { gridUtil } from '../../js/util/gridUtil';
    import { GridActionSystem } from '../../js/model/GridActionSystem';
    import { GridActionChangeLang } from '../../js/model/GridActionChangeLang';
    import { GridActionVocabLevelToggle } from '../../js/model/GridActionVocabLevelToggle';
    import EditPredefinedAction from './editActionsSub/editPredefinedAction.vue';
    import EditMatrixAction from './editActionsSub/editMatrixAction.vue';
    import EditPodcastAction from './editActionsSub/editPodcastAction.vue';

    export default {
        props: ['action', 'grids', 'gridData', 'gridElement'],
        data: function () {
            return {
                allVoices: speechService.getVoices(),
                voiceLangs: speechService.getVoicesLangs(),
                dictionaryKeys: predictionService.getDictionaryKeys(),
                collectActions: GridActionCollectElement.getActions(),
                webradioActions: GridActionWebradio.getActions(),
                allLanguages: i18nService.getAllLanguages(),
                gridLanguageCodes: [],
                selectFromAllLanguages: false,
                selectFromAllVoices: false,
                GridActionYoutube: GridActionYoutube,
                GridActionNavigate: GridActionNavigate,
                GridActionUART: GridActionUART,
                GridActionPredict: GridActionPredict,
                GridActionSystem: GridActionSystem,
                GridActionChangeLang: GridActionChangeLang,
                GridActionVocabLevelToggle: GridActionVocabLevelToggle,
                GridElement: GridElement,
                speechService: speechService,
                i18nService: i18nService
            }
        },
        components: {
            EditPodcastAction,
            EditMatrixAction,
            EditPredefinedAction,
            EditWordFormAction,
            EditAudioAction,
            RadioListSelector,
            EditAreAction,
            EditOpenHabAction,
            EditHttpAction
        },
        computed: {
            // só apresentação: ícone e nome simples de cada tipo de navegação
            iconesNavegacao() {
                let t = GridActionNavigate.NAV_TYPES, r = {};
                r[t.TO_GRID] = 'layout-grid';
                r[t.TO_HOME] = 'home';
                r[t.TO_LAST] = 'arrow-left';
                r[t.OPEN_SEARCH] = 'search';
                return r;
            },
            nomesNavegacao() {
                let t = GridActionNavigate.NAV_TYPES, r = {};
                r[t.TO_GRID] = this.$t('gestaoAcaoNavPrancha');
                r[t.TO_HOME] = this.$t('gestaoAcaoNavInicial');
                r[t.TO_LAST] = this.$t('gestaoAcaoNavAnterior');
                r[t.OPEN_SEARCH] = this.$t('gestaoAcaoNavBusca');
                for (let tipo of Object.values(t)) {
                    r[tipo] = r[tipo] || this.$t(tipo);
                }
                return r;
            }
        },
        methods: {
            getCurrentSpeakLang(action) {
                let prefVoiceLang = speechService.getPreferredVoiceLang() || i18nService.getContentLang();
                let currentVoiceLang = speechService.isVoiceLangLinkedToTextLang()  ? prefVoiceLang : i18nService.getContentLang();
                return action && action.speakLanguage ? action.speakLanguage : currentVoiceLang;
            },
            selectedRadioChanged(radioId) {
                let faviconUrl = this.gridData.webRadios.filter(el => el.radioId === radioId)[0].faviconUrl;
                if (faviconUrl) {
                    imageUtil.urlToBase64(faviconUrl).then(base64 => {
                        if (base64) {
                            this.gridElement.image = new GridImage({data: base64});
                        }
                    });
                }
            },
        },
        mounted () {
            this.gridLanguageCodes = gridUtil.getGridLangs(this.gridData);
        }
    }
</script>

<style scoped>
    .ac {
        min-width: 0;
    }
    .ac-explica {
        display: flex;
        align-items: flex-start;
        gap: var(--g-e2);
        margin: 0 0 var(--g-e3);
        color: var(--g-tinta-2);
    }
    .ac-explica .ti {
        font-size: 22px;
        color: var(--g-folha-escura);
        flex: none;
    }
    .ac-grupo {
        border: none;
        margin: 0 0 var(--g-e2);
        padding: 0;
        min-width: 0;
    }
    .ac-legenda {
        font-weight: 700;
        font-size: var(--g-t-corpo);
        margin: 0 0 var(--g-e2);
        padding: 0;
    }
    .ac-escolhas {
        grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
        margin-bottom: var(--g-e3);
    }
    .ac .g-aviso {
        margin: 0 0 var(--g-e3);
    }
    .ac .gm-avancado {
        margin: var(--g-e3) 0 0;
    }
    .ac-marcar-junto {
        margin-top: calc(-1 * var(--g-e2));
    }
</style>
