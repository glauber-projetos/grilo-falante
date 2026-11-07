<template>
    <gestao-modal :titulo="$t('gestaoAcessoSequencialTitulo')" icone="arrow-right-circle" tamanho="m" @close="cancel()">
        <template #cabeca>
            <button type="button" class="g-btn g-btn-leve g-btn-icone" @click="openHelp()" :aria-label="$t('gestaoAcessoAjuda')" :title="$t('gestaoAcessoAjuda')">
                <i class="ti ti-help-circle" aria-hidden="true"></i>
            </button>
        </template>

        <div v-if="inputConfig" class="acesso" @keydown.enter="['BUTTON', 'SUMMARY', 'SELECT', 'A'].includes($event.target.tagName) || save()">
            <p class="g-apoio acesso-intro">{{ $t('gestaoAcessoSequencialIntro') }}</p>
            <div class="gm-secao acesso-ligar">
                <label class="g-marcar">
                    <input v-focus type="checkbox" v-model="inputConfig.seqEnabled"/>
                    <span>{{ $t('gestaoAcessoSequencialLigar') }}</span>
                </label>
            </div>

            <div v-show="inputConfig.seqEnabled">
                <section class="gm-secao">
                    <h3><i class="ti ti-hand-click" aria-hidden="true"></i>{{ $t('gestaoAcessoAcionadores') }}</h3>
                    <p class="g-dica">{{ $t('gestaoAcessoAcionadoresDica') }}</p>
                    <input-event-list v-model="inputConfig.seqInputs" :input-labels="[InputConfig.NEXT_ELEMENT, InputConfig.PREVIOUS_ELEMENT, InputConfig.SELECT]" :error-inputs="errorInputs" @input="inputChanged"></input-event-list>
                    <button type="button" class="g-btn g-btn-leve" @click="resetInput"><i class="ti ti-restore" aria-hidden="true"></i>{{ $t('gestaoAcessoRestaurar') }}</button>
                </section>

                <section class="gm-secao">
                    <h3><i class="ti ti-clock" aria-hidden="true"></i>{{ $t('gestaoAcessoTempo') }}</h3>
                    <label class="g-marcar">
                        <input type="checkbox" v-model="inputConfig.seqAuto"/>
                        <span>{{ $t('gestaoAcessoSequencialAuto') }}</span>
                    </label>
                    <div class="acesso-deslizante" v-show="inputConfig.seqAuto">
                        <slider-input :label="$t('gestaoAcessoTempoParada')" id="inScanTime" min="100" max="10000" step="100" decimals="0" v-model.number="inputConfig.seqTimeoutMs"/>
                        <p class="g-dica">{{ $t('gestaoAcessoDicaMs') }}</p>
                    </div>
                </section>

                <details class="gm-avancado">
                    <summary>{{ $t('gestaoAcessoAvancado') }}</summary>
                    <div class="gm-avancado-corpo">
                        <label class="g-marcar">
                            <input type="checkbox" v-model="inputConfig.seqResetToStart"/>
                            <span>{{ $t('gestaoAcessoVoltarInicio') }}</span>
                        </label>
                        <label class="g-marcar">
                            <input type="checkbox" v-model="inputConfig.seqStartWithAction"/>
                            <span>{{ $t('gestaoAcessoComecarAoAcionar') }}</span>
                        </label>
                        <div class="acesso-deslizante">
                            <slider-input :label="$t('gestaoAcessoVoltasAteParar')" id="roundsUntilStop" min="1" max="10" step="1" decimals="0" default="3" v-model.number="inputConfig.seqRoundsUntilStop"/>
                        </div>
                        <div class="acesso-deslizante" v-show="inputConfig.seqAuto">
                            <slider-input :label="$t('gestaoAcessoPrimeiroMaisTempo')" id="inFirstElement" min="1" max="5" step="0.1" decimals="1" v-model.number="inputConfig.seqTimeoutFirstElementFactor"/>
                        </div>
                    </div>
                </details>

                <details class="gm-avancado">
                    <summary>{{ $t('gestaoAcessoGerais') }}</summary>
                    <div class="gm-avancado-corpo acesso-deslizante acesso-gerais">
                        <global-input-options :input-config="inputConfig"/>
                    </div>
                </details>

                <details class="gm-avancado acesso-teste" @toggle="$event.target.open ? (testOpen = true, initTest()) : (testOpen = false, stopTest())">
                    <summary><i class="ti ti-player-play" aria-hidden="true"></i>{{ $t('gestaoAcessoTestar') }}</summary>
                    <div class="gm-avancado-corpo">
                        <p class="g-dica">{{ $t('gestaoAcessoTestarDica') }}</p>
                        <test-area :selected-element="selectedTestElement"></test-area>
                    </div>
                </details>

                <div class="g-aviso acesso-erro" role="alert" v-if="error">
                    <i class="ti ti-alert-triangle" aria-hidden="true"></i>
                    <span>{{ $t('gestaoAcessoFaltaAcionador') }}</span>
                </div>
            </div>
        </div>

        <template #rodape>
            <button type="button" class="g-btn" @click="cancel()">{{ $t('gestaoCancelar') }}</button>
            <button type="button" class="g-btn g-btn-principal" @click="save()"><i class="ti ti-check" aria-hidden="true"></i>{{ $t('gestaoSalvar') }}</button>
        </template>
    </gestao-modal>
</template>

<script>
    import {dataService} from '../../../js/service/data/dataService'
    import {helpService} from "../../../js/service/helpService";
    import {i18nService} from "../../../js/service/i18nService";
    import GestaoModal from "../gestaoModal.vue";
    import InputEventList from "../../components/inputEventList.vue"
    import TestArea from "./testArea.vue"
    import SliderInput from "./sliderInput.vue";
    import './../../../css/modal.css';
    import {InputConfig} from "../../../js/model/InputConfig";
    import {inputEventHandler} from "../../../js/input/inputEventHandler";
    import {SequentialInput} from "../../../js/input/sequentialInput";
    import GlobalInputOptions from "./globalInputOptions.vue";

    export default {
        props: [],
        components: {GlobalInputOptions, GestaoModal, InputEventList, TestArea, SliderInput},
        data: function () {
            return {
                inputConfig: null,
                metadata: null,
                InputConfig: InputConfig,
                error: '',
                errorInputs: [],
                seqInput: null,
                testOpen: false,
                selectedTestElement: null
            }
        },
        watch: {
            inputConfig: {
                handler: function(newConfig) {
                    if (this.testOpen) {
                        this.initTest(newConfig);
                    }
                },
                deep: true
            }
        },
        methods: {
            save() {
                if (!this.validateInputs()) {
                    return;
                }
                this.metadata.inputConfig = this.inputConfig;
                dataService.saveMetadata(this.metadata).then(() => {
                    this.$emit('close');
                });
            },
            cancel() {
                this.$emit('close');
            },
            openHelp() {
                helpService.openHelp();
            },
            validateInputs() {
                this.errorInputs = [];
                this.error = "";
                if (!this.inputConfig.seqEnabled) {
                    return true;
                }
                if (this.inputConfig.seqInputs.filter(input => input.label === InputConfig.NEXT_ELEMENT).length === 0) {
                    this.errorInputs.push(InputConfig.NEXT_ELEMENT);
                }
                if (this.inputConfig.seqInputs.filter(input => input.label === InputConfig.SELECT).length === 0) {
                    this.errorInputs.push(InputConfig.SELECT);
                }
                if (this.errorInputs.length > 0) {
                    this.error = i18nService.t('pleaseSpecifyInputModalities');
                    return false;
                }
                return true;
            },
            inputChanged() {
                if (this.error) {
                    this.validateInputs();
                }
            },
            resetInput() {
                this.$set(this.inputConfig, 'seqInputs', JSON.parse(JSON.stringify(InputConfig.DEFAULT_SEQ_INPUTS)));
                this.inputChanged();
            },
            initTest() {
                setTimeout(() => {
                    let thiz = this;
                    thiz.stopTest();
                    if (thiz.inputConfig.seqEnabled) {
                        thiz.seqInput = SequentialInput.getInstanceFromConfig(thiz.inputConfig, {
                            itemSelector: '.area-element-inner',
                            selectionListener: (item) => {
                                thiz.selectedTestElement = item;
                            },
                            activeClass: 'active'
                        });
                        thiz.seqInput.start();
                    }
                }, 100);
            },
            stopTest() {
                if (this.seqInput) {
                    this.seqInput.destroy();
                }
            }
        },
        mounted () {
            let thiz = this;
            inputEventHandler.pauseAll();
            dataService.getMetadata().then(metadata => {
                thiz.metadata = JSON.parse(JSON.stringify(metadata));
                thiz.inputConfig = JSON.parse(JSON.stringify(metadata.inputConfig));
            });
            helpService.setHelpLocation('04_input_options', '#sequential-input');
        },
        beforeDestroy() {
            helpService.revertToLastLocation();
            this.stopTest();
            inputEventHandler.resumeAll();
        }
    }
</script>

<style scoped>
    .acesso-intro { margin: 0 0 var(--g-e4); }
    .acesso-ligar { padding-top: var(--g-e3); padding-bottom: var(--g-e3); }
    .acesso-ligar .g-marcar { margin: 0; align-items: center; }
    .acesso-ligar .g-marcar > span { font-weight: 700; font-size: var(--g-t-grande); }
    .acesso .gm-secao > .g-dica { margin: calc(-1 * var(--g-e2)) 0 var(--g-e3); }
    .acesso-erro { margin-top: var(--g-e4); }
    .acesso-teste > summary .ti { font-size: 1.3em; }
    .acesso-numero { align-items: center; }
    .g-campo .acesso-numero > input[type="range"] { flex: 1 1 auto; width: auto; }
    .g-campo .acesso-numero > input[type="number"] { flex: 0 0 112px; width: 112px; }
    .acesso-cores { display: grid; grid-template-columns: repeat(auto-fill, minmax(96px, 1fr)); gap: 0 var(--g-e3); margin-top: var(--g-e3); }

    /* sliderInput e globalInputOptions são compartilhados e usados como estão: aqui só muda a disposição dentro deste modal */
    .acesso-deslizante ::v-deep div,
    .acesso-deslizante ::v-deep label,
    .acesso-deslizante ::v-deep input,
    .acesso-deslizante ::v-deep button { float: none; width: auto; margin-left: 0; box-sizing: border-box; }
    .acesso-deslizante ::v-deep div { margin-top: 0; margin-bottom: 0; }
    .acesso-deslizante ::v-deep label { display: block; font-weight: 700; margin: var(--g-e2) 0 0; }
    .acesso-deslizante ::v-deep input[type="range"] {
        display: block; width: 100%; min-height: var(--g-alvo); margin: 0;
        accent-color: var(--g-folha);
    }
    .acesso-deslizante ::v-deep input[type="range"]:focus-visible { outline: none; box-shadow: var(--g-foco); border-radius: var(--g-raio-p); }
    .acesso-deslizante ::v-deep input[type="range"] + div { color: var(--g-tinta-2); font-size: var(--g-t-legenda); margin-bottom: var(--g-e3); }
    .acesso-deslizante ::v-deep input[type="range"] ~ button { min-height: var(--g-alvo); margin: 0 0 var(--g-e3); }
    .acesso-deslizante > .g-dica { margin: 0 0 var(--g-e3); }

    .acesso-gerais ::v-deep h3 { font-size: var(--g-t-grande); margin: var(--g-e4) 0 var(--g-e1); }
    .acesso-gerais ::v-deep input[type="checkbox"] {
        width: 24px; height: 24px; margin: 0 var(--g-e3) 0 0; vertical-align: middle;
        accent-color: var(--g-folha);
    }
    .acesso-gerais ::v-deep input[type="checkbox"] + label {
        display: inline-flex; align-items: center; min-height: var(--g-alvo);
        font-weight: 400; margin: 0; vertical-align: middle; cursor: pointer;
    }
</style>
