<template>
    <div class="ewfo">
        <div class="gm-grade">
            <div class="g-campo">
                <label :for="idBase + 'Valor'">{{ $t('gestaoBotaoFormaPalavra') }}</label>
                <input :id="idBase + 'Valor'" type="text" v-model="wordForm.value" @change="lastValidValue = wordForm.value || lastValidValue" @focusout="lostFocus" :placeholder="$t('gestaoBotaoFormaExemplo')" autocomplete="off"/>
            </div>
            <div class="g-campo">
                <label :for="idBase + 'Pron'">{{ $t('gestaoBotaoComoFalarOpcional') }}</label>
                <div class="gm-campo-linha">
                    <input :id="idBase + 'Pron'" type="text" v-model="wordForm.pronunciation" autocomplete="off"/>
                    <button type="button" class="g-btn g-btn-icone" :disabled="!wordForm.pronunciation && !wordForm.value" @click="speechService.speak(wordForm.pronunciation || wordForm.value)" :aria-label="$t('gestaoBotaoOuvir')" :title="$t('gestaoBotaoOuvir')">
                        <i class="ti ti-volume" aria-hidden="true"></i>
                    </button>
                </div>
            </div>
            <div class="g-campo">
                <label :for="idBase + 'Idioma'">{{ $t('gestaoBotaoIdioma') }}</label>
                <select :id="idBase + 'Idioma'" v-model="wordForm.lang">
                    <option :value="undefined">{{ $t('gestaoBotaoQualquerIdioma') }}</option>
                    <option v-for="lang in langs" :value="lang.code">{{lang | extractTranslationAppLang}} ({{ lang.code }})</option>
                </select>
            </div>
            <div class="g-campo">
                <label :for="idBase + 'Marcas'">{{ $t('gestaoBotaoMarcas') }}</label>
                <multiselect :id="idBase + 'Marcas'" v-model="wordForm.tags" :options="TAGS" :multiple="true" :close-on-select="false" :clear-on-select="false" :taggable="true" @tag="addTag(wordForm, $event)" :placeholder="$t('gestaoBotaoEscolhaMarcas')">
                </multiselect>
                <span class="g-dica">{{ $t('gestaoBotaoMarcasDica') }}</span>
            </div>
        </div>
    </div>
</template>

<script>
    import Multiselect from 'vue-multiselect';
    import {i18nService} from "../../js/service/i18nService.js";
    import {constants} from "../../js/util/constants.js";
    import {speechService} from "../../js/service/speechService.js";

    export default {
        props: ["value", "allowEmpty"],
        components: { Multiselect },
        data() {
            return {
                wordForm: this.value,
                langs: i18nService.getAllLanguages(),
                TAGS: JSON.parse(JSON.stringify(constants.WORDFORM_TAGS)),
                speechService: speechService,
                lastValidValue: this.value.value
            }
        },
        computed: {
            idBase() {
                // só apresentação: ids únicos quando há mais de um formulário na tela
                return 'ewfo' + this._uid;
            }
        },
        watch: {
            value: function (newVal, oldVal) {
                this.wordForm = newVal;
            },
            wordForm: function (newVal, oldVal) {
                this.$emit('input', newVal);
            }
        },
        methods: {
            addTag(wordForm, newTag) {
                this.TAGS.push(newTag);
                wordForm.tags.push(newTag);
            },
            lostFocus() {
                if (!this.allowEmpty) {
                    this.wordForm.value = this.wordForm.value || this.lastValidValue;
                }
            }
        },
        mounted() {
        },
    }
</script>

<style src="vue-multiselect/dist/vue-multiselect.min.css"></style>
<style scoped>
.ewfo .g-campo >>> .multiselect { min-height: var(--g-alvo); font-family: var(--g-fonte); }
.ewfo .g-campo >>> .multiselect__tags { min-height: var(--g-alvo); border: 2px solid var(--g-borda); border-radius: var(--g-raio); background: var(--g-superficie); }
.ewfo .g-campo >>> .multiselect__tag { background: var(--g-folha); }
.ewfo .g-campo >>> .multiselect__option--highlight { background: var(--g-folha); }
</style>
