<template>
    <gestao-modal :titulo="$t('gestaoAcessoMouseTitulo')" icone="hand-finger" tamanho="m" @close="cancel()">
        <template #cabeca>
            <button type="button" class="g-btn g-btn-leve g-btn-icone" @click="openHelp()" :aria-label="$t('gestaoAcessoAjuda')" :title="$t('gestaoAcessoAjuda')">
                <i class="ti ti-help-circle" aria-hidden="true"></i>
            </button>
        </template>

        <div v-if="inputConfig" class="acesso" @keydown.enter="['BUTTON', 'SUMMARY', 'SELECT', 'A'].includes($event.target.tagName) || save()">
            <p class="g-apoio acesso-intro">{{ $t('gestaoAcessoMouseIntro') }}</p>

            <section class="gm-secao">
                <h3><i class="ti ti-hand-click" aria-hidden="true"></i>{{ $t('gestaoAcessoMouseTocar') }}</h3>
                <label class="g-marcar">
                    <input v-focus type="checkbox" v-model="inputConfig.mouseclickEnabled"/>
                    <span>{{ $t('gestaoAcessoMouseClique') }}</span>
                </label>
                <label class="g-marcar">
                    <input type="checkbox" v-model="inputConfig.mouseDoubleClickEnabled"/>
                    <span>{{ $t('gestaoAcessoMouseDuplo') }}</span>
                </label>
            </section>

            <section class="gm-secao">
                <h3><i class="ti ti-eye" aria-hidden="true"></i>{{ $t('gestaoAcessoMouseParar') }}</h3>
                <label class="g-marcar">
                    <input type="checkbox" v-model="inputConfig.hoverEnabled"/>
                    <span>{{ $t('gestaoAcessoMouseHover') }}</span>
                </label>
                <div v-show="inputConfig.hoverEnabled">
                    <div class="g-campo">
                        <label for="inHoverTime">{{ $t('gestaoAcessoMouseHoverTempo') }}</label>
                        <div class="gm-campo-linha acesso-numero">
                            <input type="range" id="inHoverTime" v-model.number="inputConfig.hoverTimeoutMs" min="0" max="5000" step="100"/>
                            <input type="number" v-model.number="inputConfig.hoverTimeoutMs" min="0" max="5000" step="100" :aria-label="$t('gestaoAcessoMouseHoverNumero')"/>
                        </div>
                        <span class="g-dica">{{ $t('gestaoAcessoDicaMs') }}</span>
                    </div>
                    <label class="g-marcar">
                        <input type="checkbox" v-model="inputConfig.hoverHideCursor"/>
                        <span>{{ $t('gestaoAcessoMouseEsconderCursor') }}</span>
                    </label>
                    <label class="g-marcar">
                        <input type="checkbox" v-model="inputConfig.hoverDisableHoverpane"/>
                        <span>{{ $t('gestaoAcessoMouseSemPainel') }}</span>
                    </label>
                </div>
            </section>

            <details class="gm-avancado">
                <summary>{{ $t('gestaoAcessoAvancado') }}</summary>
                <div class="gm-avancado-corpo">
                    <label class="g-marcar">
                        <input type="checkbox" v-model="inputConfig.mouseDownInsteadClick"/>
                        <span>{{ $t('gestaoAcessoMouseAoApertar') }}</span>
                    </label>
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
    import GestaoModal from "../gestaoModal.vue";
    import InputEventList from "../../components/inputEventList.vue"
    import TestArea from "./testArea.vue"
    import './../../../css/modal.css';
    import {InputConfig} from "../../../js/model/InputConfig";
    import {Hover} from "../../../js/input/hovering";
    import {Clicker} from "../../../js/input/clicking";
    import {inputEventHandler} from "../../../js/input/inputEventHandler";
    import GlobalInputOptions from "./globalInputOptions.vue";

    export default {
        props: [],
        components: {GlobalInputOptions, GestaoModal, InputEventList, TestArea},
        data: function () {
            return {
                inputConfig: null,
                metadata: null,
                InputConfig: InputConfig,
                clicker: null,
                hover: null,
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
            initTest() {
                setTimeout(() => {
                    let thiz = this;
                    this.stopTest();
                    if (thiz.inputConfig.hoverEnabled) {
                        thiz.hover = Hover.getInstanceFromConfig(thiz.inputConfig, '.area-element-inner', {
                            demoMode: true,
                            containerClass: '.area .area-row'
                        });
                        thiz.hover.setSelectionListener(function (item) {
                            thiz.selectedTestElement = item;
                        });
                        thiz.hover.startHovering();
                    }

                    if (thiz.inputConfig.mouseclickEnabled || thiz.inputConfig.mouseDoubleClickEnabled) {
                        thiz.clicker = Clicker.getInstanceFromConfig(thiz.inputConfig, '.area-element-inner');
                        thiz.clicker.setSelectionListener(function (item) {
                            thiz.selectedTestElement = item;
                        });
                        thiz.clicker.startClickcontrol();
                    }
                }, 100);
            },
            stopTest() {
                if (this.clicker) {
                    this.clicker.destroy();
                }
                if (this.hover) {
                    this.hover.destroy();
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
            helpService.setHelpLocation('04_input_options', '#mousetouch-input');
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
