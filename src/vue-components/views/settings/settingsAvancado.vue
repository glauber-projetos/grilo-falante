<template>
    <div class="aj-avancado">
        <h3 class="aj-sub">{{ $t('ajustesAvancadoPalavras') }}</h3>
        <div class="g-campo">
            <label for="langLevel">{{ $t('ajustesAvancadoNivel') }}</label>
            <select id="langLevel" v-model="metadata.vocabularyLevel" @change="saveMetadata(metadata)">
                <option :value="null">{{ $t('showAllElements') }}</option>
                <option v-for="level in [...Array(10).keys()].map(i => i + 1)" :value="level">{{ $t('untilLevel', { level: level }) }}</option>
            </select>
            <p class="g-dica">{{ $t('ajustesAvancadoNivelDica') }}</p>
        </div>
        <label class="g-marcar">
            <input id="dontResetWordFormsAutomatically" type="checkbox" v-model="metadata.dontResetWordFormsAutomatically" @change="saveMetadata(metadata)"/>
            <span>{{ $t('dontResetWordFormsAutomatically') }}</span>
        </label>
        <label class="g-marcar">
            <input id="activateARASAACGrammarAPI" type="checkbox" v-model="metadata.activateARASAACGrammarAPI" @change="saveMetadata(metadata)"/>
            <i18n path="activateAutomaticGrammarCorrectionARASAACAPI" tag="span">
                <template v-slot:availableLangs>
                    <span>{{ util.arrayToPrintable(arasaacService.getSupportedGrammarLangs(true)) }}</span>
                </template>
            </i18n>
        </label>
        <p class="g-dica">
            <i18n path="noteThatActivatingThisSendsSentencesToARASAACSeePrivacy" tag="span">
                <template v-slot:link>
                    <a target="_blank" rel="noopener" :href="i18nService.isCurrentAppLangDE() ? 'app/privacy_de.html?back=settings#data-transfer' : 'app/privacy_en.html?back=settings#data-transfer'">{{ $t('privacyPolicy') }}</a>
                </template>
            </i18n>
        </p>

        <h3 class="aj-sub">{{ $t('ajustesAvancadoAparelhos') }}</h3>
        <label class="g-marcar">
            <input id="chkSyncNavigation" type="checkbox" v-model="appSettings.syncNavigation" @change="saveAppSettings(appSettings)"/>
            <span>{{ $t('ajustesAvancadoSincronizar') }}</span>
        </label>

        <h3 class="aj-sub">{{ $t('ajustesAvancadoIntegracoes') }}</h3>
        <div class="g-campo">
            <label for="externalSpeechUrl">{{ $t('ajustesAvancadoVozExterna') }}</label>
            <div class="aj-teste-linha">
                <input type="text" id="externalSpeechUrl" v-model="appSettings.externalSpeechServiceUrl" @input="onSpeechUrlInput" placeholder="http://localhost:5555" autocomplete="off" spellcheck="false"/>
                <span class="g-pilula" v-show="urlValid === undefined"><i class="ti ti-loader-2" aria-hidden="true"></i>{{ $t('ajustesAvancadoConferindo') }}</span>
                <span class="g-pilula g-pilula-ok" v-show="urlValid"><i class="ti ti-check" aria-hidden="true"></i>{{ $t('urlIsValid') }}</span>
                <span class="g-pilula aj-pilula-erro" v-show="urlValid === false"><i class="ti ti-x" aria-hidden="true"></i>{{ $t('urlIsInvalid') }}</span>
            </div>
            <p class="g-dica">
                <i18n path="findDetailsAt" tag="span">
                    <template v-slot:link>
                        <a target="_blank" rel="noopener" href="https://github.com/asterics/Asterics-AAC-Helper?tab=readme-ov-file#speech">{{ $t('infoAboutExternalSpeechService') }}</a>
                    </template>
                </i18n>
            </p>
        </div>
        <div class="g-campo">
            <span class="aj-rotulo">{{ $t('ajustesAvancadoMatrix') }}</span>
            <div>
                <button class="g-btn" @click="matrixAberto = true"><i class="ti ti-message-2" aria-hidden="true"></i>{{ $t('configureMatrixMessenger') }}</button>
            </div>
        </div>
        <configure-matrix v-if="matrixAberto" @close="matrixAberto = false"></configure-matrix>
    </div>
</template>

<script>
    import { i18nService } from '../../../js/service/i18nService';
    import { util } from '../../../js/util/util';
    import { arasaacService } from '../../../js/service/pictograms/arasaacService';
    import { speechServiceExternal } from '../../../js/service/speechServiceExternal';
    import { speechService } from '../../../js/service/speechService';
    import { settingsSaveMixin } from './settingsSaveMixin';
    import ConfigureMatrix from '../../modals/matrix-messenger/configure-matrix.vue';

    /**
     * Ajustes > Avançado (collapsed): what was in "Integrações", plus vocabulary level, word forms and
     * synchronizing the child mode between devices.
     */
    export default {
        components: { ConfigureMatrix },
        props: ["metadata", "userSettingsLocal", "appSettings"],
        mixins: [settingsSaveMixin],
        data() {
            return {
                i18nService: i18nService,
                util: util,
                arasaacService: arasaacService,
                urlValid: null,
                matrixAberto: false
            }
        },
        methods: {
            async onSpeechUrlInput() {
                let savedSomething = await this.saveAppSettings(this.appSettings);
                if (savedSomething) {
                    this.urlValid = undefined;
                    this.urlValid = await speechServiceExternal.validateUrl(this.appSettings.externalSpeechServiceUrl);
                    this.urlValid = this.appSettings.externalSpeechServiceUrl ? this.urlValid : null;
                    let timeout = this.urlValid ? 0 : 3000;
                    util.debounce(async () => {
                        await speechService.reinit();
                    }, timeout, 'REINIT_SPEECH');
                }
            }
        }
    }
</script>

<style scoped>
    .aj-teste-linha {
        display: flex;
        gap: var(--g-e3);
        align-items: center;
        flex-wrap: wrap;
    }
    .aj-teste-linha > input { flex: 1 1 240px; width: auto !important; }
    .aj-rotulo { font-weight: 700; }
    .aj-pilula-erro { background: var(--g-perigo-claro); color: var(--g-perigo); }
</style>
