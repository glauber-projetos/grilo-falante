<template>
    <div class="offline-voice-helper">
        <div class="ovh-estado" :class="'ovh-' + nivel" aria-live="polite">
            <i :class="'ti ti-' + (loading ? 'loader-2' : statusIcon)" aria-hidden="true"></i>
            <span>{{ loading ? $t('ajustesOfflineConferindo') : statusText }}</span>
        </div>
        <div class="ovh-acoes" v-if="!loading">
            <button id="offlineVoiceSample" class="g-btn g-btn-falar" @click="listenSample" :disabled="testing || !testVoice">
                <i class="ti ti-volume" aria-hidden="true"></i>{{ $t('offlineVoiceListenSample') }}
            </button>
            <button v-if="canSelect && testVoice && testVoice.id !== currentVoiceId" class="g-btn g-btn-principal" @click="$emit('use-voice', testVoice.id)">
                <i class="ti ti-check" aria-hidden="true"></i>{{ $t('offlineVoiceUseThisVoice') }}
            </button>
            <button class="g-btn" @click="reload" :disabled="testing">
                <i class="ti ti-refresh" aria-hidden="true"></i>{{ $t('offlineVoiceSearchAgain') }}
            </button>
        </div>
        <p class="g-dica" v-if="testVoice && !loading">{{ $t('offlineVoiceTestedVoice', { name: testVoice.name }) }}</p>
        <p class="ovh-mensagem" v-if="sampleMessage" aria-live="polite"><strong>{{ sampleMessage }}</strong></p>
        <details v-if="!loading" class="aj-mais" :open="wizardOpen" @toggle="wizardOpen = $event.target.open">
            <summary><i class="ti ti-download" aria-hidden="true"></i>{{ platform === 'android' ? $t('offlineVoiceHowToInstallAndroid') : $t('offlineVoiceHowToInstall') }}</summary>
            <div class="aj-mais-corpo">
                <ol v-if="platform === 'android' || platform === 'other'" class="ovh-passos">
                    <li>{{ $t('offlineVoiceAndroidStep1') }}</li>
                    <li>{{ $t('offlineVoiceAndroidStep2') }}</li>
                    <li>{{ $t('offlineVoiceAndroidStep3') }}</li>
                    <li>{{ $t('offlineVoiceAndroidStep4') }}</li>
                    <li>{{ $t('offlineVoiceAndroidStep5') }}</li>
                    <li>{{ $t('offlineVoiceAndroidStep6') }}</li>
                    <li>{{ $t('offlineVoiceAndroidStep7') }}</li>
                </ol>
                <p v-if="platform === 'other'">{{ $t('offlineVoiceStepsAreForAndroid') }}</p>
                <p v-if="platform === 'ios'">{{ $t('offlineVoiceIosHint') }}</p>
                <p v-if="platform === 'windows'">{{ $t('offlineVoiceWindowsHint') }}</p>
            </div>
        </details>
    </div>
</template>

<script>
    import { speechService } from '../../../js/service/speechService';
    import { offlineVoiceService } from '../../../js/service/offlineVoiceService';
    import { constants } from '../../../js/util/constants';

    /**
     * Checks if a Brazilian voice works without internet. Used in Ajustes > Sem internet and in the setup wizard.
     * Props/events unchanged: canSelect, currentVoiceId, emits "use-voice" with the voice id.
     */
    export default {
        props: {
            canSelect: { type: Boolean, default: false }, // show "use this voice" (emits 'use-voice')
            currentVoiceId: { type: String, default: undefined }
        },
        data() {
            return {
                loading: true,
                testing: false,
                voiceStatus: null,
                sampleMessage: '',
                platform: offlineVoiceService.getPlatform(),
                wizardOpen: false
            };
        },
        computed: {
            testVoice() {
                if (!this.voiceStatus) {
                    return null;
                }
                // test the chosen voice, if it's a Brazilian device voice, otherwise the best one found
                let chosen = this.voiceStatus.ptBrVoices.find(v => v.id === this.currentVoiceId);
                return chosen || this.voiceStatus.bestVoice;
            },
            status() {
                return this.voiceStatus ? this.voiceStatus.status : null;
            },
            statusText() {
                switch (this.status) {
                    case offlineVoiceService.STATUS_CONFIRMED:
                        return this.$t('offlineVoiceStatusConfirmed');
                    case offlineVoiceService.STATUS_PROBABLY_OFFLINE:
                        return this.$t('offlineVoiceStatusProbably');
                    case offlineVoiceService.STATUS_ONLINE_ONLY:
                        return this.$t('offlineVoiceStatusOnlineOnly');
                    case offlineVoiceService.STATUS_ONLY_OTHER_PORTUGUESE:
                        return this.$t('offlineVoiceStatusOtherPortuguese');
                    default:
                        return this.$t('offlineVoiceStatusMissing');
                }
            },
            nivel() {
                if (this.loading) {
                    return 'neutro';
                }
                if (this.status === offlineVoiceService.STATUS_CONFIRMED) {
                    return 'ok';
                }
                return this.status === offlineVoiceService.STATUS_PROBABLY_OFFLINE ? 'neutro' : 'aviso';
            },
            statusIcon() {
                return { ok: 'circle-check', neutro: 'info-circle', aviso: 'alert-triangle' }[this.nivel];
            }
        },
        methods: {
            async loadStatus() {
                let voices = await speechService.getVoicesInitialized();
                this.voiceStatus = offlineVoiceService.getStatus(voices, {
                    nativeType: constants.VOICE_TYPE_NATIVE,
                    deviceDefaultId: constants.VOICE_DEVICE_DEFAULT
                });
                if (this.loading) {
                    // open the install steps when no good voice was found
                    this.wizardOpen = this.status !== offlineVoiceService.STATUS_CONFIRMED && this.status !== offlineVoiceService.STATUS_PROBABLY_OFFLINE;
                }
                this.loading = false;
            },
            async reload() {
                this.loading = true;
                this.sampleMessage = '';
                await speechService.reinit();
                // Android Chrome loads its voice list a little later
                setTimeout(() => this.loadStatus(), 800);
            },
            async listenSample() {
                let voice = this.testVoice;
                if (!voice) {
                    return;
                }
                this.testing = true;
                this.sampleMessage = '';
                let online = navigator.onLine;
                let result = await speechService.speakSample(voice.id, this.$t('offlineVoiceSampleSentence'));
                if (result.started === true && !online) {
                    offlineVoiceService.recordSampleResult(voice.id, result, online);
                    this.sampleMessage = this.$t('offlineVoiceSampleWorkedOffline');
                } else if (result.started === true) {
                    this.sampleMessage = this.$t('offlineVoiceSampleWorkedOnline');
                } else if (result.started === null) {
                    this.sampleMessage = this.$t('offlineVoiceSampleNeedsInternet');
                } else {
                    if (!online) {
                        offlineVoiceService.forgetVoice(voice.id);
                    }
                    this.sampleMessage = this.$t('offlineVoiceSampleFailed');
                    this.wizardOpen = true;
                }
                this.testing = false;
                await this.loadStatus();
            }
        },
        async mounted() {
            await this.loadStatus();
        }
    };
</script>

<style scoped>
    .ovh-estado {
        display: flex;
        gap: var(--g-e3);
        align-items: flex-start;
        padding: var(--g-e3) var(--g-e4);
        border-radius: var(--g-raio);
        background: var(--g-superficie-2);
        color: var(--g-tinta);
        margin-bottom: var(--g-e3);
    }
    .ovh-estado .ti { font-size: 24px; flex: none; }
    .ovh-ok { background: var(--g-folha-clara); color: var(--g-folha-escura); }
    .ovh-aviso { background: var(--g-girassol-claro); color: #4a3b00; }
    .ovh-acoes {
        display: flex;
        gap: var(--g-e3);
        flex-wrap: wrap;
        margin-bottom: var(--g-e3);
    }
    .ovh-mensagem { margin: 0 0 var(--g-e3); }
    .ovh-passos { padding-left: 1.4em; margin: 0; }
    .ovh-passos li { margin-bottom: var(--g-e2); }
    /* same look as Ajustes "Mais opções", also when used in the setup wizard */
    .aj-mais { border: 2px solid var(--g-borda); border-radius: var(--g-raio); background: var(--g-superficie); }
    .aj-mais > summary {
        display: flex; align-items: center; gap: var(--g-e2);
        min-height: var(--g-alvo); padding: 0 var(--g-e4);
        font-weight: 700; cursor: pointer; list-style: none;
    }
    .aj-mais > summary::-webkit-details-marker { display: none; }
    .aj-mais > summary .ti { font-size: 21px; color: var(--g-folha-escura); }
    .aj-mais-corpo { padding: 0 var(--g-e4) var(--g-e4); }
</style>
