<template>
    <gestao-modal :titulo="$t('gestaoPalavrasAcrescentar')" :subtitulo="$t('gestaoPalavrasNaLista', [dictData.dictionaryKey])" icone="text-plus"
                  @close="$emit('close')" @keyup.ctrl.enter.native="parsedElems.length > 0 && save()">
        <template #cabeca>
            <button type="button" class="g-btn g-btn-leve g-btn-icone" @click="openHelp()" :aria-label="$t('gestaoArquivoAjuda')" :title="$t('gestaoArquivoAjuda')">
                <i class="ti ti-help-circle" aria-hidden="true"></i>
            </button>
        </template>

        <div class="g-campo">
            <label for="inputText">{{ $t('gestaoPalavrasEscreva') }}</label>
            <textarea id="inputText" v-model="inputText" @input="textChanged" :placeholder="$t('gestaoPalavrasEscrevaExemplo')" aria-describedby="inputTextDica"></textarea>
            <span id="inputTextDica" class="g-dica">{{ $t('gestaoPalavrasEscrevaDica') }}</span>
        </div>

        <section class="gm-secao" aria-live="polite">
            <h3><i class="ti ti-checks" aria-hidden="true"></i>{{ $t('gestaoPalavrasEncontradas', [elementCount]) }}</h3>
            <ul v-show="parsedElems.length > 0" class="pw-palavras">
                <li v-for="(elem, index) in parsedElems" :key="index" class="g-pilula">{{ elem }}</li>
                <li v-if="parsedElems.length < elementCount" class="g-pilula pw-mais">+{{ elementCount - parsedElems.length }}</li>
            </ul>
            <p v-show="parsedElems.length === 0" class="g-dica pw-nenhuma">{{ $t('gestaoPalavrasNenhumaAinda') }}</p>
        </section>

        <details class="gm-avancado">
            <summary>{{ $t('gestaoArquivoAvancado') }}</summary>
            <div class="gm-avancado-corpo">
                <p class="g-dica">{{ $t('gestaoPalavrasAvancadoDica') }}</p>
                <div class="gm-grade">
                    <div class="g-campo">
                        <label for="inputElementSeparator">{{ $t('elementSeparator') }}</label>
                        <input id="inputElementSeparator" type="text" v-model="elementSeparator" @input="textChanged"/>
                    </div>
                    <div class="g-campo">
                        <label for="inputRankSeparator">{{ $t('inelementSeparator') }}</label>
                        <input id="inputRankSeparator" type="text" v-model="rankSeparator" @input="textChanged"/>
                    </div>
                    <div class="g-campo">
                        <label for="inputElIndex">{{ $t('wordIndex0based') }}</label>
                        <input id="inputElIndex" type="number" v-model="wordPosition" @input="textChanged"/>
                    </div>
                    <div class="g-campo">
                        <label for="inputRankIndex">{{ $t('rankIndex0based') }}</label>
                        <input id="inputRankIndex" type="number" v-model="rankPosition" @input="textChanged"/>
                    </div>
                </div>
            </div>
        </details>

        <template #rodape>
            <button type="button" class="g-btn" @click="$emit('close')" :title="$t('keyboardEsc')">{{ $t('gestaoCancelar') }}</button>
            <button type="button" class="g-btn g-btn-principal" @click="save()" :title="$t('keyboardCtrlEnter')" :disabled="parsedElems.length == 0">
                <i class="ti ti-check" aria-hidden="true"></i>{{ elementCount > 0 ? $t('gestaoPalavrasAcrescentarN', [elementCount]) : $t('gestaoPalavrasAcrescentar') }}
            </button>
        </template>
    </gestao-modal>
</template>

<script>
    import {dataService} from '../../js/service/data/dataService'
    import {i18nService} from "../../js/service/i18nService";
    import GestaoModal from './gestaoModal.vue';
    import Predictionary from 'predictionary'
    import {helpService} from "../../js/service/helpService";

    let predictionary = Predictionary.instance();

    export default {
        components: {GestaoModal},
        props: ['dictData'],
        data: function () {
            return {
                inputText: "",
                parsedElems: [],
                elementCount: 0,
                elementSeparator: '[\\n; ]',
                rankSeparator: null,
                wordPosition: null,
                rankPosition: null,
                showAdvanced: false,
                originalPredictionary: null
            }
        },
        methods: {
            textChanged() {
                predictionary = Predictionary.instance();
                this.parseInternal(predictionary);
                this.parsedElems = predictionary.predict('', {maxPredicitons: 20});
                this.elementCount = predictionary.getWords().length;
            },
            save() {
                var thiz = this;
                thiz.parseInternal(this.originalPredictionary);
                thiz.dictData.data = this.originalPredictionary.dictionaryToJSON(this.dictData.dictionaryKey);
                dataService.saveDictionary(thiz.dictData).then(() => {
                    thiz.$emit('reload', thiz.dictData);
                    thiz.$emit('close');
                });
            },
            parseInternal(predictionaryInstance) {
                try {
                    predictionaryInstance.parseWords(this.inputText, {
                        elementSeparator: new RegExp(this.elementSeparator),
                        rankSeparator: new RegExp(this.rankSeparator),
                        wordPosition: this.wordPosition,
                        rankPosition: this.rankPosition,
                        addToDictionary: this.dictData.dictionaryKey
                    });
                } catch (e) {
                    log.warn('error parsing words: ' + e);
                }
            },
            openHelp() {
                helpService.openHelp();
            }
        },
        mounted() {
            this.originalPredictionary = Predictionary.instance();
            this.originalPredictionary.loadDictionary(this.dictData.data, this.dictData.dictionaryKey);
            helpService.setHelpLocation('07_dictionaries', '#add-words');
        },
        beforeDestroy() {
            helpService.revertToLastLocation();
        }
    }
</script>

<style scoped>
    .pw-palavras { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: var(--g-e2); }
    .pw-palavras li { margin: 0; font-size: var(--g-t-corpo); color: var(--g-tinta); background: var(--g-folha-clara); }
    .pw-palavras .pw-mais { background: var(--g-superficie-2); color: var(--g-tinta-2); }
    .pw-nenhuma { margin: 0; }
</style>
