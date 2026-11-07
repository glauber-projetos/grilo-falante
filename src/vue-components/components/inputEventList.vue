<template>
    <div class="acionadores">
        <ul class="gm-lista acionadores-lista">
            <li v-for="(input, index) in inputs" :class="{'acionador-erro': errorInputs.indexOf(input.label) > -1}">
                <div class="acionador-topo">
                    <div class="g-campo acionador-tipo">
                        <label :for="input.label + index">{{ $t('gestaoAcessoPapel' + input.label, [index + 1]) }}</label>
                        <select :id="input.label + index" @change="typeChange(index, $event.target.value)">
                            <option value="">{{ $t('gestaoAcessoTipoNenhum') }}</option>
                            <option v-for="inputEvent in inputEventTypes" :value="inputEvent.getModelName()" :selected="inputEvent.getModelName() === input.modelName">
                                {{ $t('gestaoAcessoTipo' + inputEvent.getModelName()) }}
                            </option>
                        </select>
                    </div>
                    <span class="g-erro acionador-falta" v-show="errorInputs.indexOf(input.label) > -1">
                        <i class="ti ti-alert-triangle" aria-hidden="true"></i>{{ $t('gestaoAcessoFalta') }}
                    </span>
                </div>

                <!-- tecla, toque ou clique -->
                <div v-if="input.modelName === InputEventKey.getModelName()" class="acionador-corpo">
                    <div class="g-linha">
                        <button type="button" class="g-btn" :class="{'g-btn-principal': keyRecording[input.label+index]}" @click="recordKey(input, index)">
                            <i class="ti ti-keyboard" aria-hidden="true"></i>
                            <span v-show="!keyRecording[input.label+index]">{{ $t('gestaoAcessoGravarTecla') }}</span>
                            <span v-show="keyRecording[input.label+index]">{{ $t('gestaoAcessoGravando') }}</span>
                        </button>
                        <span class="acionador-atual" aria-live="polite">
                            <span class="g-apoio">{{ $t('gestaoAcessoTeclaAtual') }}</span>
                            <strong v-show="!input.keyCode" class="g-pilula">{{ $t('gestaoAcessoSemTecla') }}</strong>
                            <strong v-show="input.keyCode && InputEventKey.SPECIAL_KEYS.includes(input.keyCode)" class="g-pilula g-pilula-ok">{{input.keyCode | translate}}</strong>
                            <strong v-show="input.keyCode && !InputEventKey.SPECIAL_KEYS.includes(input.keyCode)" class="g-pilula g-pilula-ok">{{input.keyName + ' (' + input.keyCode + ')'}}</strong>
                        </span>
                    </div>
                    <details class="gm-avancado acionador-mais">
                        <summary>{{ $t('gestaoAcessoMaisOpcoes') }}</summary>
                        <div class="gm-avancado-corpo gm-grade gm-grade-3">
                            <div class="g-campo">
                                <label :for="'inTimeout' + index">{{ $t('gestaoAcessoEsperaMs') }}</label>
                                <input :id="'inTimeout' + index" type="number" min="0" max="5000" step="100" v-model.number="input.timeout" @input="modelChanged"/>
                            </div>
                            <div class="g-campo">
                                <label :for="'inRepeat' + index">{{ $t('gestaoAcessoRepeticoes') }}</label>
                                <input v-show="input.holdDuration === 0" :id="'inRepeat' + index" type="number" min="1" max="9" v-model.number="input.repeat" @input="modelChanged"/>
                                <span v-show="input.holdDuration > 0" class="g-dica">
                                    <span>{{ $t('gestaoAcessoDesligadoSegurar') }}</span>
                                    <button type="button" class="g-btn g-btn-leve" @click="input.holdDuration = 0; modelChanged();">{{ $t('gestaoAcessoLigar') }}</button>
                                </span>
                            </div>
                            <div class="g-campo">
                                <label :for="'inHold' + index">{{ $t('gestaoAcessoSegurar') }}</label>
                                <input v-show="input.repeat === 1" :id="'inHold' + index" type="number" min="0" max="5000" step="100" v-model.number="input.holdDuration" :disabled="input.repeat > 1" @input="modelChanged"/>
                                <span v-show="input.repeat > 1" class="g-dica">
                                    <span>{{ $t('gestaoAcessoDesligadoRepeticoes') }}</span>
                                    <button type="button" class="g-btn g-btn-leve" @click="input.repeat = 1; modelChanged();">{{ $t('gestaoAcessoLigar') }}</button>
                                </span>
                            </div>
                        </div>
                    </details>
                </div>

                <!-- som no microfone -->
                <div v-if="input.modelName === InputEventAudio.getModelName()" class="acionador-corpo">
                    <div class="g-linha">
                        <button type="button" class="g-btn" :class="{'g-btn-principal': micRecording}" @click="toggleMicRecording">
                            <template v-if="!micRecording"><i class="ti ti-microphone" aria-hidden="true"></i><span>{{ $t('gestaoAcessoOuvir') }}</span></template>
                            <template v-if="micRecording"><i class="ti ti-microphone-off" aria-hidden="true"></i><span>{{ $t('gestaoAcessoPararOuvir') }}</span></template>
                        </button>
                    </div>
                    <p class="g-erro" role="alert" v-if="micRecordError">
                        <i class="ti ti-alert-triangle" aria-hidden="true"></i> {{ $t('gestaoAcessoMicPermitir') }}
                    </p>
                    <p class="g-dica" v-show="!micRecording">{{ $t('gestaoAcessoNaoOuvindo') }}</p>

                    <div class="acionador-grupo">
                        <h4><i class="ti ti-volume" aria-hidden="true"></i>{{ $t('gestaoAcessoVolume') }}</h4>
                        <div class="g-campo">
                            <label :for="'volThresholdHigh' + index"><span class="g-oculto-leitor">{{ $t('gestaoAcessoVolume') }}: </span>{{ $t('gestaoAcessoLimiteAlto') }}</label>
                            <div class="gm-campo-linha acionador-faixa">
                                <input :id="'volThresholdHigh' + index" type="range" min="0.1" :max="getMicVolMaxRange(input)" step="0.1" v-model.number="input.volThresholdHigh" @input="validateChange(input, true); modelChanged();"/>
                                <span class="acionador-valor">{{ input.volThresholdHigh.toFixed(1) }} %</span>
                            </div>
                        </div>
                        <div class="g-campo" v-show="micRecording">
                            <label :for="'volAgora' + index"><span class="g-oculto-leitor">{{ $t('gestaoAcessoVolume') }}: </span>{{ $t('gestaoAcessoAgora') }}</label>
                            <div class="gm-campo-linha acionador-faixa">
                                <input :id="'volAgora' + index" type="range" min="0.1" :max="getMicVolMaxRange(input)" step="0.1" disabled v-model.number="micValues.volLive"/>
                                <span class="acionador-valor">{{ (Math.round(micValues.volLive * 100) / 100).toFixed(1) }} %</span>
                            </div>
                        </div>
                        <div class="g-campo">
                            <label :for="'volThresholdLow' + index"><span class="g-oculto-leitor">{{ $t('gestaoAcessoVolume') }}: </span>{{ $t('gestaoAcessoLimiteBaixo') }}</label>
                            <div class="gm-campo-linha acionador-faixa">
                                <input :id="'volThresholdLow' + index" type="range" min="0.1" :max="getMicVolMaxRange(input)" step="0.1" v-model.number="input.volThresholdLow" @input="validateChange(input, false); modelChanged();"/>
                                <span class="acionador-valor">{{ input.volThresholdLow.toFixed(1) }} %</span>
                            </div>
                        </div>
                    </div>

                    <details class="gm-avancado acionador-mais">
                        <summary>{{ $t('gestaoAcessoTom') }}</summary>
                        <div class="gm-avancado-corpo">
                            <div class="g-campo">
                                <label :for="'freqThresholdHigh' + index"><span class="g-oculto-leitor">{{ $t('gestaoAcessoTom') }}: </span>{{ $t('gestaoAcessoLimiteAlto') }}</label>
                                <div class="gm-campo-linha acionador-faixa">
                                    <input :id="'freqThresholdHigh' + index" type="range" min="0" :max="getMicFreqMaxRange(input)" step="100" v-model.number="input.freqThresholdHigh" @input="validateChange(input, true); modelChanged();"/>
                                    <span class="acionador-valor">{{ input.freqThresholdHigh }} Hz</span>
                                </div>
                            </div>
                            <div class="g-campo" v-show="micRecording">
                                <label :for="'freqAgora' + index"><span class="g-oculto-leitor">{{ $t('gestaoAcessoTom') }}: </span>{{ $t('gestaoAcessoAgora') }}</label>
                                <div class="gm-campo-linha acionador-faixa">
                                    <input :id="'freqAgora' + index" type="range" min="0" :max="getMicFreqMaxRange(input)" step="100" disabled v-model.number="micValues.inputMaxFreqMap[input]"/>
                                    <span class="acionador-valor">{{ Math.round(micValues.inputMaxFreqMap[input]) }} Hz</span>
                                </div>
                            </div>
                            <div class="g-campo">
                                <label :for="'freqThresholdLow' + index"><span class="g-oculto-leitor">{{ $t('gestaoAcessoTom') }}: </span>{{ $t('gestaoAcessoLimiteBaixo') }}</label>
                                <div class="gm-campo-linha acionador-faixa">
                                    <input :id="'freqThresholdLow' + index" type="range" min="0" :max="getMicFreqMaxRange(input)" step="100" v-model.number="input.freqThresholdLow" @input="validateChange(input, false); modelChanged();"/>
                                    <span class="acionador-valor">{{ input.freqThresholdLow }} Hz</span>
                                </div>
                            </div>
                        </div>
                    </details>
                </div>

                <!-- sistema externo -->
                <div v-if="input.modelName === InputEventARE.getModelName()" class="acionador-corpo">
                    <div class="g-linha">
                        <button type="button" class="g-btn" :class="{'g-btn-principal': keyRecording[input.label+index]}" @click="recordAREEvent(input, index)">
                            <i class="ti ti-bolt" aria-hidden="true"></i>
                            <span v-show="!keyRecording[input.label+index]">{{ $t('gestaoAcessoGravarExterno') }}</span>
                            <span v-show="keyRecording[input.label+index]">{{ $t('gestaoAcessoEsperandoSinal') }}</span>
                        </button>
                    </div>
                    <p class="g-erro" role="alert" v-show="areError[input.label+index]">
                        <i class="ti ti-alert-triangle" aria-hidden="true"></i>
                        {{ $t('gestaoAcessoErroExterno', [areService.getRestURL(input.areURL)]) }}
                    </p>
                    <ul class="acionador-sinais" v-if="input.eventNames && input.eventNames.length">
                        <li v-for="(eventName, index) in input.eventNames">
                            <span class="acionador-sinal-texto"><span class="g-apoio">{{ $t('gestaoAcessoSinal') }}:</span> {{formatAreEvent(eventName)}}</span>
                            <button type="button" class="g-btn g-btn-leve g-btn-icone" @click="removeAREEvent(input, index)" :aria-label="$t('gestaoAcessoApagarSinal')" :title="$t('gestaoAcessoApagarSinal')"><i class="ti ti-trash" aria-hidden="true"></i></button>
                        </li>
                    </ul>
                    <details class="gm-avancado acionador-mais">
                        <summary>{{ $t('gestaoAcessoEnderecoExterno') }}</summary>
                        <div class="gm-avancado-corpo">
                            <div class="g-campo">
                                <label :for="'inputAreUrl' + index">{{ $t('gestaoAcessoEnderecoExterno') }}</label>
                                <input :id="'inputAreUrl' + index" type="text" v-model="input.areURL" @change="changedAreURL(input)" @input="areError[input.label+index] = false"/>
                                <span class="g-dica">{{ $t('gestaoAcessoVazioAutomatico') }}</span>
                            </div>
                        </div>
                    </details>
                </div>
            </li>
        </ul>
    </div>
</template>

<script>
    import Vue from 'vue';
    import {InputConfig} from "../../js/model/InputConfig";
    import {InputEventKey} from "../../js/model/InputEventKey";
    import {InputEventAudio} from "../../js/model/InputEventAudio";
    import {InputEventARE} from "../../js/model/InputEventARE";
    import {inputEventHandler} from "../../js/input/inputEventHandler";
    import {areService} from "../../js/service/areService";
    import {audioUtil} from "../../js/util/audioUtil.js";

    export default {
        props: {
            value: Array,
            inputLabels: Array,
            canAdd: Boolean,
            maxElements: Number,
            errorInputs: Array,
            minInputs: Number,
            maxInputs: Number
        },
        watch: {
            value: {
                handler: function (newValue) {
                    this.initWithValue(newValue);
                },
                deep: true
            }
        },
        data() {
            return {
                inputs: [],
                inputEventTypes: InputConfig.getInputEventTypes(),
                InputEventKey: InputEventKey,
                InputEventAudio: InputEventAudio,
                InputEventARE: InputEventARE,
                InputConfig: InputConfig,
                keyRecording: {},
                areRecording: {},
                areError: {},
                micRecording: false,
                micRecordError: false,
                micValues: {
                    volLive: 0,
                    volMax: 0,
                    inputMaxFreqMap: {}
                },
                lastEmitValue: null,
                localEventHandler: inputEventHandler.instance(),
                lastInitTime: null,
                areService: areService
            }
        },
        methods: {
            typeChange(elementIndex, type) {
                let currentElement = this.inputs[elementIndex];
                let emptyElements = this.inputs.filter(e => !e.modelName);
                if (!type) {
                    currentElement.modelName = "";
                    if (this.minInputs && this.inputs.length > this.minInputs && emptyElements.length >= 1) {
                        this.inputs.splice(elementIndex, 1);
                    }
                    this.modelChanged();
                    return;
                }
                let newElement = InputConfig.getInputEventInstance(type, {label: currentElement.label});
                Vue.set(this.inputs, elementIndex, JSON.parse(JSON.stringify(newElement)));
                if (this.maxInputs && this.inputs.length < this.maxInputs && emptyElements.length <= 1) {
                    this.addInput();
                }
                this.modelChanged();
            },
            recordKey(input, index) {
                let thiz = this;
                let recordingID = input.label + index;
                if (thiz.keyRecording[recordingID]) {
                    Vue.set(thiz.keyRecording, recordingID, false);
                    thiz.localEventHandler.destroy();
                    return;
                }

                Vue.set(thiz.keyRecording, recordingID, true);
                thiz.localEventHandler.destroy();
                thiz.localEventHandler = inputEventHandler.instance();
                thiz.localEventHandler.onAnyKey((keyCode, keyName, event) => {
                    event.preventDefault();
                    thiz.localEventHandler.destroy();
                    input.keyCode = keyCode;
                    input.keyName = keyName;
                    Object.assign(input, {
                        repeat: 1,
                        timeout: 0,
                        holdDuration: 0
                    });
                    Vue.set(thiz.keyRecording, recordingID, false);
                    thiz.modelChanged();
                });
                thiz.localEventHandler.startListening();
            },
            recordAREEvent(input, index) {
                let thiz = this;
                let recordingID = input.label + index;
                thiz.areError[recordingID] = false;
                if (thiz.keyRecording[recordingID]) {
                    endRecord();
                    return;
                }

                Vue.set(thiz.keyRecording, recordingID, true);
                areService.unsubscribeEvents();
                let timeoutHandler = null;
                areService.subscribeEvents(input.areURL, (data) => {
                    if (!timeoutHandler) {
                        timeoutHandler = setTimeout(() => {
                            Vue.set(thiz.keyRecording, recordingID, false);
                            areService.unsubscribeEvents();
                            thiz.modelChanged();
                        }, 1000);
                    }
                    input.eventNames.push(data);
                }, () => {
                    thiz.areError[recordingID] = true;
                    endRecord();
                });

                function endRecord() {
                    Vue.set(thiz.keyRecording, recordingID, false);
                    areService.unsubscribeEvents();
                }
            },
            removeAREEvent(input, index) {
                input.eventNames.splice(index, 1);
                this.modelChanged();
            },
            formatAreEvent(eventString) {
                let eventObject = JSON.parse(eventString);
                return eventObject.channelId + " -> " + eventObject.targetComponentId;
            },
            changedAreURL(input) {
                if (!input.areURL) {
                    return;
                }
                input.areURL = areService.getRestURL(input.areURL);
            },
            validateChange(input, highChanged) {
                if (input.volThresholdHigh < input.volThresholdLow) {
                    if (highChanged) {
                        input.volThresholdHigh = input.volThresholdLow;
                    } else {
                        input.volThresholdLow = input.volThresholdHigh;
                    }
                }
                if (input.freqThresholdHigh < input.freqThresholdLow) {
                    if (highChanged) {
                        input.freqThresholdHigh = input.freqThresholdLow;
                    } else {
                        input.freqThresholdLow = input.freqThresholdHigh;
                    }
                }
            },
            modelChanged() {
                let passInputs = this.inputs.filter(input => {
                    if (!input.modelName) {
                        return false;
                    }
                    let instance = InputConfig.getInputEventInstance(input.modelName, input);
                    return instance.isValid();
                });
                let emitValue = JSON.parse(JSON.stringify(passInputs));
                if (JSON.stringify(emitValue) !== JSON.stringify(this.lastEmitValue)) {
                    this.lastInitTime = new Date().getTime();
                    this.$emit('input', emitValue);
                    this.lastEmitValue = emitValue;
                }
            },
            addInput(count) {
                count = count || 1;
                for (let i = 0; i < count; i++) {
                    let newInput = JSON.parse(JSON.stringify(new InputEventKey({label: InputConfig.GENERAL_INPUT})));
                    newInput.modelName = null;
                    this.inputs.push(newInput);
                }
            },
            initWithValue(value) {
                if (this.lastInitTime && new Date().getTime() - this.lastInitTime < 500) {
                    //TODO this is not the most beautiful way to prevent self-caused model reload
                    return;
                }
                this.lastInitTime = new Date().getTime();
                let originalValue = JSON.parse(JSON.stringify(value)) || [];
                this.lastEmitValue = JSON.parse(JSON.stringify(originalValue));
                if (this.inputLabels) {
                    let existingLabels = originalValue.map(input => input.label);
                    let missingLabels = this.inputLabels.filter(label => existingLabels.indexOf(label) === -1);
                    missingLabels.forEach(label => {
                        let inputEvent = new InputEventARE({label: label});
                        inputEvent.modelName = "";
                        originalValue.push(inputEvent);
                    });
                    originalValue.sort((a, b) => this.inputLabels.indexOf(a.label) - this.inputLabels.indexOf(b.label));
                }
                this.inputs = JSON.parse(JSON.stringify(originalValue));
                let emptyElements = this.inputs.filter(e => !e.modelName);
                if (this.maxInputs && this.inputs.length < this.maxInputs && emptyElements.length <= 1) {
                    this.addInput();
                }
                if (this.minInputs && this.inputs.length < this.minInputs) {
                    this.addInput(this.minInputs - this.inputs.length);
                }
            },
            micVolumeCallback(volume, frequency) {
                this.micValues.volLive = volume;
                this.micValues.volMax = Math.max(volume, this.micValues.volMax);
                for (let input of this.inputs) {
                    if (volume > input.volThresholdHigh) {
                        this.micValues.inputMaxFreqMap[input] = frequency;
                    }
                }
            },
            async toggleMicRecording() {
                this.micRecordError = false;
                try {
                    if (!this.micRecording) {
                        await audioUtil.addMicVolumeCallback(this.micVolumeCallback);
                        this.micRecording = true;
                    } else {
                        await audioUtil.removeMicVolumeCallback(this.micVolumeCallback);
                        this.micRecording = false;
                    }
                } catch (e) {
                    this.micRecordError = true;
                }
            },
            getMicVolMaxRange(input) {
                let maxValueConsidered = Math.max(input.volThresholdLow + 5, input.volThresholdHigh + 5);
                return Math.min(maxValueConsidered, 100);
            },
            getMicFreqMaxRange(input) {
                let inputMaxFreq = this.micValues.inputMaxFreqMap[input] || 0;
                let maxValueConsidered = Math.max(inputMaxFreq + 1000, input.freqThresholdLow + 1000, input.freqThresholdHigh + 1000);
                return Math.min(maxValueConsidered, 20000);
            }
        },
        mounted() {
            this.initWithValue(this.value);
        }
    }
</script>

<style scoped>
    .acionadores-lista > li {
        flex-direction: column;
        align-items: stretch;
        gap: var(--g-e2);
        padding: var(--g-e3) var(--g-e4);
    }
    .acionadores-lista > li.acionador-erro { border-color: var(--g-perigo); }

    .acionador-topo { display: flex; flex-wrap: wrap; align-items: flex-end; gap: var(--g-e2) var(--g-e4); }
    .acionador-tipo { flex: 1 1 240px; min-width: 0; margin-bottom: 0; }
    .acionador-falta { display: inline-flex; align-items: center; gap: var(--g-e1); min-height: var(--g-alvo); }
    .acionador-falta .ti { font-size: 1.3em; }

    .acionador-corpo { display: flex; flex-direction: column; gap: var(--g-e2); }
    .acionador-corpo > p { margin: 0; }
    .acionador-atual { display: inline-flex; flex-wrap: wrap; align-items: center; gap: var(--g-e2); }
    .acionador-mais { margin: 0; }
    .acionador-mais .g-dica { display: flex; flex-wrap: wrap; align-items: center; gap: var(--g-e2); }

    .acionador-grupo h4 {
        display: flex; align-items: center; gap: var(--g-e2);
        font-size: var(--g-t-corpo); font-weight: 700; margin: var(--g-e2) 0;
    }
    .acionador-grupo h4 .ti { color: var(--g-folha-escura); font-size: 1.3em; }
    .acionador-faixa { align-items: center; }
    .g-campo .acionador-faixa > input[type="range"] { flex: 1 1 auto; width: auto; }
    .acionador-valor { flex: 0 0 80px; text-align: right; color: var(--g-tinta-2); font-variant-numeric: tabular-nums; }

    .acionador-sinais { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: var(--g-e1); }
    .acionador-sinais > li {
        display: flex; align-items: center; gap: var(--g-e2); margin: 0;
        padding-left: var(--g-e3); border-radius: var(--g-raio-p); background: var(--g-superficie-2);
    }
    .acionador-sinal-texto { flex: 1; min-width: 0; overflow-wrap: anywhere; }
</style>
