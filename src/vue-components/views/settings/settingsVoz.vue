<template>
    <div class="aj-voz">
        <div class="g-campo">
            <label for="ajVoz">{{ $t('ajustesVozEscolher') }}</label>
            <select id="ajVoz" v-model="userSettingsLocal.voiceConfig.preferredVoice" @change="resetVoiceProps(); saveUserSettings(true)">
                <option :value="undefined">{{ $t('ajustesVozAutomatica') }}</option>
                <option v-for="voice in selectVoices" :value="voice.id">{{ getVoiceDisplayText(voice, selectAllVoices) }}</option>
            </select>
            <p class="g-dica">{{ $t('ajustesVozEscolherDica') }}</p>
        </div>
        <label class="g-marcar">
            <input type="checkbox" id="ajTodasVozes" v-model="selectAllVoices" @change="showAllVoicesChanged()"/>
            <span>{{ $t('ajustesVozMostrarTodas') }}</span>
        </label>

        <div class="g-campo aj-teste">
            <label for="ajTextoTeste">{{ $t('ajustesVozFraseTeste') }}</label>
            <div class="aj-teste-linha">
                <input id="ajTextoTeste" type="text" v-model="testText"/>
                <button id="ajOuvirVoz" class="g-btn g-btn-falar" @click="testSpeak">
                    <i class="ti ti-volume" aria-hidden="true"></i>{{ $t('ajustesVozOuvir') }}
                </button>
            </div>
        </div>

        <ajuste-deslizar id="ajVelocidade" :label="$t('ajustesVozVelocidade')" min="0.5" max="2" step="0.1" decimals="1" :padrao="1"
                         :formatar="formatarVelocidade" :rotulo-min="$t('ajustesVozDevagar')" :rotulo-max="$t('ajustesVozRapido')"
                         :disabled="!userSettingsLocal.voiceConfig.preferredVoice"
                         :dica="userSettingsLocal.voiceConfig.preferredVoice ? '' : $t('ajustesVozVelocidadeDica')"
                         v-model.number="userSettingsLocal.voiceConfig.voiceRate" @change="saveUserSettings(true)"/>

        <p class="aj-link-offline">
            <a href="javascript:;" class="g-btn g-btn-leve" @click="$emit('ir-para', 'ajustes-sem-internet')">
                <i class="ti ti-wifi-off" aria-hidden="true"></i>{{ $t('ajustesVozSemInternetLink') }}
            </a>
        </p>

        <details class="aj-mais" @toggle="maisAberto = $event.target.open">
            <summary><i class="ti ti-adjustments-horizontal" aria-hidden="true"></i>{{ $t('ajustesVozMais') }}</summary>
            <div class="aj-mais-corpo" v-if="maisAberto">
                <ajuste-deslizar id="ajAltura" :label="$t('ajustesVozAltura')" min="0.1" max="2" step="0.1" decimals="1" :padrao="1"
                                 :rotulo-min="$t('ajustesVozGrave')" :rotulo-max="$t('ajustesVozAgudo')"
                                 :disabled="!userSettingsLocal.voiceConfig.preferredVoice"
                                 v-model.number="userSettingsLocal.voiceConfig.voicePitch" @change="saveUserSettings(true)"/>
                <ajuste-deslizar v-if="userSettingsLocal.voiceConfig.preferredVoice" id="ajVelocidadeExtra" :label="$t('ajustesVozVelocidadeExtra')"
                                 min="0.1" max="10" step="0.1" decimals="1" :padrao="1" :formatar="formatarVelocidade"
                                 v-model.number="userSettingsLocal.voiceConfig.voiceRate" @change="saveUserSettings(true)"/>
                <div class="g-campo">
                    <label for="ajSegundaVoz">{{ $t('ajustesVozSegunda') }}</label>
                    <div class="aj-teste-linha">
                        <select id="ajSegundaVoz" v-model="userSettingsLocal.voiceConfig.secondVoice" @change="saveUserSettings(true)">
                            <option :value="undefined">{{ $t('ajustesVozNenhuma') }}</option>
                            <option v-for="voice in voices" :value="voice.id">{{ getVoiceDisplayText(voice, true) }}</option>
                        </select>
                        <button class="g-btn" :disabled="!userSettingsLocal.voiceConfig.secondVoice" @click="speechService.testSpeak(userSettingsLocal.voiceConfig.secondVoice)">
                            <i class="ti ti-volume" aria-hidden="true"></i>{{ $t('ajustesVozOuvir') }}
                        </button>
                    </div>
                    <p class="g-dica">{{ $t('ajustesVozSegundaDica') }}</p>
                </div>
                <label class="g-marcar">
                    <input type="checkbox" v-model="userSettingsLocal.voiceConfig.voiceLangIsTextLang" @change="saveUserSettings(true)"/>
                    <span>{{ $t('ajustesVozIdiomaDoTexto') }}</span>
                </label>
                <label class="g-marcar">
                    <input type="checkbox" v-model="userSettingsLocal.voiceConfig.waitForSpeechToFinish" @change="saveUserSettings(true)"/>
                    <span>{{ $t('ajustesVozEsperarTerminar') }}</span>
                </label>
                <div v-show="!!speechService.getExternalVoice(userSettingsLocal.voiceConfig.preferredVoice)" class="g-linha">
                    <button class="g-btn" @click="cacheAll()" :disabled="externalVoiceCacheProgress !== undefined && externalVoiceCacheProgress !== 100">
                        <i class="ti ti-download" aria-hidden="true"></i>{{ $t('cacheAllTextsOfCurrentConfigurationExternalVoice') }}
                    </button>
                    <span v-show="externalVoiceCacheProgress !== undefined" class="g-pilula">{{ externalVoiceCacheProgress }}%</span>
                </div>
            </div>
        </details>
    </div>
</template>

<script>
    import { voiceProfileService } from "../../../js/service/voiceProfileService";
    import { i18nService } from "../../../js/service/i18nService";
    import { dataService } from "../../../js/service/data/dataService";
    import { localStorageService } from "../../../js/service/data/localStorageService";
    import { speechService } from "../../../js/service/speechService";
    import { speechServiceExternal } from "../../../js/service/speechServiceExternal.js";
    import { util } from "../../../js/util/util";
    import { settingsSaveMixin } from './settingsSaveMixin';
    import AjusteDeslizar from './ajusteDeslizar.vue';

    let KEY_SETTINGS_SHOW_ALL_VOICES = "KEY_SETTINGS_SHOW_ALL_VOICES";

    /**
     * Ajustes > Voz: choose the voice, test it, speed (and the advanced voice options).
     * Same data and saving as the old "Language" tab: userSettingsLocal.voiceConfig + child's profile.
     */
    export default {
        components: { AjusteDeslizar },
        props: ["userSettingsLocal", "metadata"],
        mixins: [settingsSaveMixin],
        data() {
            return {
                selectAllVoices: JSON.parse(localStorageService.get(KEY_SETTINGS_SHOW_ALL_VOICES)) || false,
                speechService: speechService,
                voices: [],
                selectVoices: [],
                externalVoiceCacheProgress: undefined,
                testText: i18nService.t('ajustesVozFraseTesteTexto'),
                maisAberto: false,
                lastSavedSettingsString: JSON.stringify(this.userSettingsLocal)
            }
        },
        methods: {
            saveUserSettings(voiceChangedByUser) {
                if (voiceChangedByUser) {
                    this.voiceChangedByUser = true;
                }
                if (JSON.stringify(this.userSettingsLocal) === this.lastSavedSettingsString) {
                    return;
                }
                this.$emit("changing");
                util.debounce(() => {
                    this.saveUserSettingsLocal(this.userSettingsLocal, 0); // method from mixin
                    if (this.voiceChangedByUser) {
                        // keep the voice in the child's profile, so it's the same on all devices
                        this.voiceChangedByUser = false;
                        voiceProfileService.saveToProfile(this.userSettingsLocal.voiceConfig);
                    }
                    this.lastSavedSettingsString = JSON.stringify(this.userSettingsLocal);
                    this.atualizarVozes();
                }, 300, 'SAVE_USERSETTINGS_VOZ');
            },
            /** called also by settingsView when the language of the boards changed */
            atualizarVozes() {
                this.lastSavedSettingsString = JSON.stringify(this.userSettingsLocal);
                this.selectVoices = this.getSelectVoices();
                this.fixCurrentVoice(true);
            },
            fixCurrentVoice(dontSave) {
                if (!this.selectVoices.map(v => v.id).includes(this.userSettingsLocal.voiceConfig.preferredVoice)) {
                    this.userSettingsLocal.voiceConfig.preferredVoice = undefined;
                    if (!dontSave) {
                        this.saveUserSettings();
                    }
                }
            },
            showAllVoicesChanged() {
                this.selectVoices = this.getSelectVoices();
                this.fixCurrentVoice();
                localStorageService.save(KEY_SETTINGS_SHOW_ALL_VOICES, this.selectAllVoices);
            },
            getSelectVoices() {
                if (!this.voices) {
                    return [];
                }
                this.voices.sort(speechService.voiceSortFn);
                if (this.selectAllVoices) {
                    return this.voices;
                }
                return this.voices.filter(v => i18nService.getBaseLang(v.lang) === i18nService.getContentLangBase());
            },
            resetVoiceProps() {
                this.userSettingsLocal.voiceConfig.voicePitch = 1;
                this.userSettingsLocal.voiceConfig.voiceRate = 1;
            },
            /** voice chosen in the "Sem internet" voice check */
            useVoice(voiceId) {
                if (!this.selectVoices.map(v => v.id).includes(voiceId)) {
                    this.selectAllVoices = true;
                    this.showAllVoicesChanged();
                }
                this.userSettingsLocal.voiceConfig.preferredVoice = voiceId;
                this.resetVoiceProps();
                this.saveUserSettings(true);
            },
            testSpeak() {
                speechService.speak(this.testText, { preferredVoice: this.userSettingsLocal.voiceConfig.preferredVoice });
            },
            getVoiceDisplayText(voice, allVoicesShown) {
                let where = voice.local ? this.$t('ajustesVozNoAparelho') : this.$t('ajustesVozPelaInternet');
                if (allVoicesShown) {
                    let lang = i18nService.te(`lang.${voice.lang}`) ? i18nService.t(`lang.${voice.lang}`) : voice.langFull;
                    return `${lang}: ${voice.name} (${where})`;
                }
                return `${voice.name} (${where})`;
            },
            formatarVelocidade(valor) {
                if (!valor && valor !== 0) {
                    valor = 1;
                }
                return valor.toFixed(1).replace('.', ',') + '×';
            },
            async cacheAll() {
                let allGrids = await dataService.getGrids();
                let externalVoice = speechService.getExternalVoice(this.userSettingsLocal.voiceConfig.preferredVoice);
                speechServiceExternal.cacheAll(allGrids, externalVoice, (progress) => {
                    this.externalVoiceCacheProgress = progress;
                });
            }
        },
        async mounted() {
            this.voices = await speechService.getVoicesInitialized();
            this.selectVoices = this.getSelectVoices();
        }
    }
</script>

<style scoped>
    .aj-teste-linha {
        display: flex;
        gap: var(--g-e3);
        align-items: stretch;
        flex-wrap: wrap;
    }
    .aj-teste-linha > input, .aj-teste-linha > select {
        flex: 1 1 220px;
        width: auto !important;
    }
    .aj-teste-linha > .g-btn { flex: none; }
    .aj-link-offline { margin: 0 0 var(--g-e3); }
    .aj-link-offline .g-btn { padding: 0 var(--g-e3); text-decoration: none; }
</style>
