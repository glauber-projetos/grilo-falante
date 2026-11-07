<template>
    <div class="au">
        <div class="au-estado" :class="{'au-gravando': recording, 'au-tem-som': action.dataBase64 && !recording}" role="status" aria-live="polite">
            <span class="au-estado-icone" aria-hidden="true">
                <i :class="recording ? 'ti ti-microphone' : (action.dataBase64 ? 'ti ti-music' : 'ti ti-microphone-off')"></i>
            </span>
            <span class="au-estado-texto">
                <strong v-if="recording">{{ i18nService.t('recordingSeconds', (recordTimeMs / 1000).toFixed(1)) }}</strong>
                <strong v-else-if="!action.dataBase64">{{ $t('gestaoAcaoAudioNenhum') }}</strong>
                <strong v-else-if="action.filename">{{ i18nService.t('audioFromFileWithName', action.filename) }}</strong>
                <strong v-else-if="action.durationMs">{{ $t('gestaoAcaoAudioGravado', [(action.durationMs / 1000).toFixed(1)]) }}</strong>
                <strong v-else>{{ $t('gestaoAcaoResumoSomPronto') }}</strong>
                <small v-if="recording">{{ $t('gestaoAcaoAudioToqueParar') }}</small>
                <small v-else-if="!action.dataBase64">{{ $t('gestaoAcaoAudioComoGravar') }}</small>
            </span>
        </div>
        <div v-if="recording" class="au-barra" aria-hidden="true">
            <span :style="{width: Math.min(100, recordTimeMs / 100) + '%'}"></span>
        </div>

        <div class="au-botoes">
            <button type="button" class="g-btn g-btn-grande au-btn" :class="recording ? 'g-btn-perigo' : 'g-btn-principal'" @click="toggleRecord()" :disabled="playing">
                <i :class="recording ? 'ti ti-player-stop' : 'ti ti-microphone'" aria-hidden="true"></i>
                <span>{{ recording ? $t('gestaoAcaoAudioParar') : (action.dataBase64 ? $t('gestaoAcaoAudioGravarDeNovo') : $t('gestaoAcaoAudioGravar')) }}</span>
            </button>
            <button type="button" class="g-btn g-btn-grande au-btn" @click="togglePlaying()" :disabled="recording || !action.dataBase64">
                <i :class="playing ? 'ti ti-player-stop' : 'ti ti-player-play'" aria-hidden="true"></i>
                <span>{{ playing ? $t('gestaoAcaoAudioParar') : $t('gestaoAcaoAudioOuvir') }}</span>
            </button>
            <button type="button" class="g-btn g-btn-grande g-btn-perigo au-btn" @click="clearAll(); $forceUpdate()" :disabled="recording || playing || !action.dataBase64">
                <i class="ti ti-trash" aria-hidden="true"></i>
                <span>{{ $t('gestaoAcaoAudioApagar') }}</span>
            </button>
        </div>

        <div class="au-arquivo">
            <input type="file" id="inputFile" class="g-oculto-leitor" tabindex="-1" aria-hidden="true" @change="changedFile" accept="audio/*"/>
            <button type="button" class="g-btn g-btn-leve" onclick="document.getElementById('inputFile').click();" :disabled="recording || playing">
                <i class="ti ti-file-music" aria-hidden="true"></i><span>{{ $t('gestaoAcaoAudioArquivo') }}</span>
            </button>
            <span class="g-dica">{{ $t('gestaoAcaoAudioArquivoDica') }}</span>
        </div>

        <p class="g-aviso au-aviso" v-if="showError" role="alert">
            <i class="ti ti-alert-triangle" aria-hidden="true"></i><span>{{ $t('pleaseAllowAccessingMicrophoneInOrderToRecordAudio') }}.</span>
        </p>
        <p class="g-aviso au-aviso" v-if="showError2" role="alert">
            <i class="ti ti-alert-triangle" aria-hidden="true"></i><span>{{ $t('selectedAudioFileIsTooBig') }}.</span>
        </p>
        <div class="g-aviso au-aviso" v-if="globalHasContinuousSpeakAction">
            <i class="ti ti-info-circle" aria-hidden="true"></i>
            <div>
                <p class="au-aviso-texto">{{ $t('recordedAudioIsOnlyPlayedWithCollectElementActions') }}.</p>
                <button type="button" class="g-btn" @click="setModePlaySeparately">{{ $t('setActionsOfGlobalGridToModeSpeakSeparately') }}</button>
            </div>
        </div>
        <div class="g-aviso au-aviso au-ok" v-if="updatedGlobalSpeakActions">
            <i class="ti ti-circle-check" aria-hidden="true"></i>
            <div>
                <p class="au-aviso-texto">{{ $t('speakActionsOfGlobalGridWereSetToModeModeSpeak') }}.</p>
                <button type="button" class="g-btn g-btn-leve" @click="undoSetModePlaySeparately">
                    <i class="ti ti-arrow-back-up" aria-hidden="true"></i><span>{{ $t('undo') }}</span>
                </button>
            </div>
        </div>
    </div>
</template>

<script>
import './../../../css/modal.css';
import {audioUtil} from "../../../js/util/audioUtil.js";
import {i18nService} from "../../../js/service/i18nService.js";
import {dataService} from "../../../js/service/data/dataService.js";
import {GridActionCollectElement} from "../../../js/model/GridActionCollectElement.js";
import { imageUtil } from '../../../js/util/imageUtil';

const MAX_RECORD_TIME = 10000;

export default {
    props: ['action', 'gridData'],
    data: function () {
        return {
            audioUtil: audioUtil,
            recordTimeMs: 0,
            recording: false,
            playing: false,
            intervalHandler: null,
            showError: null,
            showError2: null,
            i18nService: i18nService,
            globalGrid: null,
            originalGlobalGrid: null,
            updatedGlobalSpeakActions: false
        }
    },
    computed: {
        globalHasContinuousSpeakAction() {
            if (!this.globalGrid) {
                return false;
            }
            for (let element of this.globalGrid.gridElements) {
                for (let action of element.actions) {
                    if (action.modelName === GridActionCollectElement.getModelName()) {
                        if ([GridActionCollectElement.COLLECT_ACTION_SPEAK_CONTINUOUS, GridActionCollectElement.COLLECT_ACTION_SPEAK_CONTINUOUS_CLEAR].includes(action.action)) {
                            return true;
                        }
                    }
                }
            }
            return false;
        }
    },
    methods: {
        changedFile() {
            let thiz = this;
            if ($('#inputFile')[0].files[0].size > 200 * 1024) {
                this.showError2 = true;
                return;
            }
            imageUtil.getBase64FromInput($('#inputFile')[0]).then(base64 => {
                this.clearAll();
                thiz.action.dataBase64 = imageUtil.dataStringToBase64(base64)
                thiz.action.filename = $('#inputFile')[0].files[0].name;
                thiz.$forceUpdate();
            });
        },
        toggleRecord() {
            if (this.recording) {
                this.stopRecording();
            } else {
                this.record();
            }
        },
        togglePlaying() {
            if (this.playing) {
                this.stopPlaying();
            } else {
                this.play();
            }
        },
        async record() {
            this.clearAll();
            try {
                await audioUtil.record(data => {
                    this.action.dataBase64 = data.base64;
                    this.action.mimeType = data.mimeType;
                    this.action.durationMs = this.recordTimeMs;
                    this.$forceUpdate();
                });
            } catch (e) {
                this.showError = true;
                return;
            }
            this.recording = true;
            this.recordTimeMs = 0;
            this.intervalHandler = setInterval(() => {
                this.recordTimeMs += 100;
                if (this.recordTimeMs === MAX_RECORD_TIME) {
                    this.stopRecording();
                }
            }, 100);
        },
        setModePlaySeparately() {
            for (let element of this.globalGrid.gridElements) {
                for (let action of element.actions) {
                    if (action.modelName === GridActionCollectElement.getModelName()) {
                        if (action.action === GridActionCollectElement.COLLECT_ACTION_SPEAK_CONTINUOUS) {
                            action.action = GridActionCollectElement.COLLECT_ACTION_SPEAK;
                        }
                        if (action.action === GridActionCollectElement.COLLECT_ACTION_SPEAK_CONTINUOUS_CLEAR) {
                            action.action = GridActionCollectElement.COLLECT_ACTION_SPEAK_CLEAR;
                        }
                    }
                }
            }
            dataService.saveGrid(this.globalGrid);
            this.updatedGlobalSpeakActions = true;
        },
        undoSetModePlaySeparately() {
            this.globalGrid = JSON.parse(JSON.stringify(this.originalGlobalGrid));
            dataService.saveGrid(this.globalGrid);
            this.updatedGlobalSpeakActions = false;
        },
        stopRecording() {
            this.recording = false;
            clearInterval(this.intervalHandler);
            audioUtil.stopRecording();
        },
        play() {
            this.playing = true;
            audioUtil.playAudio(this.action.dataBase64, {
                onended: () => {
                    this.playing = false;
                }
            });
        },
        stopPlaying() {
            this.playing = false;
            audioUtil.stopAudio();
        },
        clearAll() {
            this.showError = false;
            this.showError2 = false;
            this.action.dataBase64 = '';
            this.action.filename = '';
            this.action.durationMs = null;
            this.action.mimeType = '';
        }
    },
    async mounted () {
        this.globalGrid = JSON.parse(JSON.stringify(await dataService.getGlobalGrid()));
        this.originalGlobalGrid = JSON.parse(JSON.stringify(this.globalGrid));
    },
    beforeDestroy() {
    }
}
</script>

<style scoped>
.au-estado {
    display: flex;
    align-items: center;
    gap: var(--g-e3);
    padding: var(--g-e3) var(--g-e4);
    margin-bottom: var(--g-e3);
    border-radius: var(--g-raio);
    border: 2px solid var(--g-borda);
    background: var(--g-superficie);
}
.au-estado-icone {
    width: 48px;
    height: 48px;
    flex: none;
    display: grid;
    place-items: center;
    border-radius: 50%;
    background: var(--g-superficie-2);
    color: var(--g-tinta-2);
    font-size: 26px;
}
.au-tem-som .au-estado-icone {
    background: var(--g-folha-clara);
    color: var(--g-folha-escura);
}
.au-gravando {
    border-color: var(--g-coral);
}
.au-gravando .au-estado-icone {
    background: var(--g-coral);
    color: #fff;
    animation: au-pulsar 1.2s ease-in-out infinite;
}
.au-estado-texto {
    min-width: 0;
    overflow-wrap: anywhere;
}
.au-estado-texto strong {
    display: block;
    font-size: var(--g-t-grande);
}
.au-estado-texto small {
    display: block;
    color: var(--g-tinta-2);
    font-size: var(--g-t-legenda);
}
.au-barra {
    height: 8px;
    border-radius: var(--g-raio-pilula);
    background: var(--g-superficie-2);
    overflow: hidden;
    margin: calc(-1 * var(--g-e1)) 0 var(--g-e3);
}
.au-barra span {
    display: block;
    height: 100%;
    background: var(--g-coral);
    transition: width 100ms linear;
}
.au-botoes {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: var(--g-e2);
    margin-bottom: var(--g-e3);
}
.au-btn {
    padding: 0 var(--g-e3);
}
.au-arquivo {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--g-e1) var(--g-e3);
    margin-bottom: var(--g-e2);
}
.au-aviso {
    margin: var(--g-e3) 0 0;
}
.au-ok {
    background: var(--g-folha-clara);
    color: var(--g-folha-escura);
}
.au-aviso-texto {
    margin: 0 0 var(--g-e2);
}
@keyframes au-pulsar {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.08); }
}
@media (prefers-reduced-motion: reduce) {
    .au-gravando .au-estado-icone { animation: none; }
    .au-barra span { transition: none; }
}
@media (max-width: 600px) {
    .au-botoes {
        grid-template-columns: minmax(0, 1fr);
    }
}
</style>
