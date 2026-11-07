<template>
    <div class="wf">
        <div class="gm-grade">
            <div class="g-campo">
                <label for="selectMode">{{ $t('gestaoAcaoOQueFazer') }}</label>
                <select id="selectMode" v-model="action.type">
                    <option v-for="mode in GridActionWordForm.MODES" :value="mode">{{ mode | translate }}</option>
                </select>
            </div>
            <div class="g-campo" v-if="action.type === GridActionWordForm.WORDFORM_MODE_NEXT_FORM">
                <label for="selectMode2">{{ $t('gestaoAcaoFormaDepois') }}</label>
                <select id="selectMode2" v-model="action.secondaryType">
                    <option :value="undefined">{{ $t('noneSelected') }}</option>
                    <option v-for="mode in GridActionWordForm.MODES_SECONDARY" :value="mode">{{ mode | translate }}</option>
                </select>
            </div>
        </div>
        <div v-if="![GridActionWordForm.WORDFORM_MODE_NEXT_FORM, GridActionWordForm.WORDFORM_MODE_RESET_FORMS].includes(action.type)">
            <div class="g-campo">
                <label for="wfEtiquetas">{{ $t('gestaoAcaoFormaEtiquetas') }}</label>
                <multiselect id="wfEtiquetas" v-model="action.tags" :options="TAGS" :multiple="true" :close-on-select="false" :clear-on-select="false" :taggable="true" @tag="addTag($event)" :placeholder="$t('gestaoAcaoEscolherEtiquetas')">
                </multiselect>
                <span class="g-dica">{{ $t('gestaoAcaoFormaEtiquetasDica') }}</span>
            </div>
            <label class="g-marcar">
                <input type="checkbox" id="chkToggle" v-model="action.toggle"/>
                <span>{{ $t('toggleTagOnSelectingItMultipleTimes') }}</span>
            </label>
        </div>
    </div>
</template>

<script>
import './../../../css/modal.css';
import Multiselect from 'vue-multiselect';
import {constants} from "../../../js/util/constants.js";
import {GridActionWordForm} from "../../../js/model/GridActionWordForm.js";


export default {
    props: ['action', 'gridData'],
    components: { Multiselect },
    data: function () {
        return {
            TAGS: JSON.parse(JSON.stringify(constants.WORDFORM_TAGS)),
            GridActionWordForm: GridActionWordForm
        }
    },
    methods: {
        addTag(newTag) {
            this.TAGS.push(newTag);
            this.action.tags.push(newTag);
        }
    },
    mounted () {
    },
    beforeDestroy() {
    }
}
</script>

<style scoped>
.wf ::v-deep .multiselect__tags {
    min-height: var(--g-alvo);
    border: 2px solid var(--g-borda);
    border-radius: var(--g-raio);
    font-family: var(--g-fonte);
    font-size: var(--g-t-corpo);
}
.wf ::v-deep .multiselect--active .multiselect__tags {
    border-color: var(--g-folha);
}
.wf ::v-deep .multiselect__tag {
    background: var(--g-folha);
    border-radius: var(--g-raio-pilula);
}
.wf ::v-deep .multiselect__option--highlight,
.wf ::v-deep .multiselect__option--highlight::after {
    background: var(--g-folha);
}
</style>
