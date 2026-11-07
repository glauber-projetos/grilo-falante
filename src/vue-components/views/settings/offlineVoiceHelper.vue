<template>
    <div class="offline-voice-helper">
        <div class="srow" aria-live="polite">
            <span v-if="loading" class="fas fa-spin fa-spinner"></span>
            <template v-else>
                <span :class="statusIcon" aria-hidden="true"></span>
                <span class="break-word"> {{ statusText }}</span>
            </template>
        </div>
        <div class="srow" v-if="!loading">
            <button id="offlineVoiceSample" class="four columns" @click="listenSample" :disabled="testing || !testVoice">
                <span class="fas fa-volume-up" aria-hidden="true"></span> {{ $t('offlineVoiceListenSample') }}
            </button>
            <button v-if="canSelect && testVoice && testVoice.id !== currentVoiceId" class="four columns" @click="$emit('use-voice', testVoice.id)">
                {{ $t('offlineVoiceUseThisVoice') }}
            </button>
            <button class="four columns" @click="reload" :disabled="testing">
                <span class="fas fa-sync" aria-hidden="true"></span> {{ $t('offlineVoiceSearchAgain') }}
            </button>
        </div>
        <div class="srow" v-if="testVoice && !loading">
            <span class="break-word">{{ $t('offlineVoiceTestedVoice', { name: testVoice.name }) }}</span>
        </div>
        <div class="srow" v-if="sampleMessage" aria-live="polite">
            <strong class="break-word">{{ sampleMessage }}</strong>
        </div>
        <div class="srow" v-if="!loading">
            <accordion :acc-label="platform === 'android' ? $t('offlineVoiceHowToInstallAndroid') : $t('offlineVoiceHowToInstall')" :acc-open="showWizardOpen" ref="wizard">
                <div class="wizard">
                    <ol v-if="platform === 'android' || platform === 'other'">
                        <li>{{ $t('offlineVoiceAndroidStep1') }}</li>
                        <li>{{ $t('offlineVoiceAndroidStep2') }}</li>
                        <li>{{ $t('offlineVoiceAndroidStep3') }}</li>
                        <li>{{ $t('offlineVoiceAndroidStep4') }}</li>
                        <li>{{ $t('offlineVoiceAndroidStep5') }}</li>
                        <li>{{ $t('offlineVoiceAndroidStep6') }}</li>
                        <li>{{ $t('offlineVoiceAndroidStep7') }}</li>
                    </ol>
                    <p v-if="platform === 'other'" class="break-word">{{ $t('offlineVoiceStepsAreForAndroid') }}</p>
                    <p v-if="platform === 'ios'" class="break-word">{{ $t('offlineVoiceIosHint') }}</p>
                    <p v-if="platform === 'windows'" class="break-word">{{ $t('offlineVoiceWindowsHint') }}</p>
                </div>
            </accordion>
        </div>
    </div>
</template>

<script>
    import { speechService } from '../../../js/service/speechService';
    import { offlineVoiceService } from '../../../js/service/offlineVoiceService';
    import { constants } from '../../../js/util/constants';
    import Accordion from '../../components/accordion.vue';

    export default {
        components: { Accordion },
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
                online: navigator.onLine,
                platform: offlineVoiceService.getPlatform()
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
            statusIcon() {
                if (this.status === offlineVoiceService.STATUS_CONFIRMED) {
                    return 'fas fa-check-circle';
                }
                if (this.status === offlineVoiceService.STATUS_PROBABLY_OFFLINE) {
                    return 'fas fa-info-circle';
                }
                return 'fas fa-exclamation-triangle';
            },
            showWizardOpen() {
                return this.status !== offlineVoiceService.STATUS_CONFIRMED && this.status !== offlineVoiceService.STATUS_PROBABLY_OFFLINE;
            }
        },
        methods: {
            async loadStatus() {
                let voices = await speechService.getVoicesInitialized();
                this.voiceStatus = offlineVoiceService.getStatus(voices, {
                    nativeType: constants.VOICE_TYPE_NATIVE,
                    deviceDefaultId: constants.VOICE_DEVICE_DEFAULT
                });
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
                    if (this.$refs.wizard) {
                        this.$refs.wizard.open();
                    }
                }
                this.testing = false;
                await this.loadStatus();
            },
            onOnlineChange() {
                this.online = navigator.onLine;
            }
        },
        async mounted() {
            window.addEventListener('online', this.onOnlineChange);
            window.addEventListener('offline', this.onOnlineChange);
            await this.loadStatus();
        },
        beforeDestroy() {
            window.removeEventListener('online', this.onOnlineChange);
            window.removeEventListener('offline', this.onOnlineChange);
        }
    };
</script>

<style scoped>
    .srow {
        margin-bottom: 1em;
    }
    .wizard {
        padding: 0.5em 1em;
    }
    .wizard li {
        margin-bottom: 0.5em;
    }
    button .fas {
        margin-right: 0.25em;
    }
</style>
