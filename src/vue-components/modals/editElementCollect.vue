<template>
    <div class="ec" v-if="gridElement">
        <p class="g-apoio ec-intro">{{ $t('gestaoBotaoFraseIntro') }}</p>
        <div class="g-campo">
            <label for="selectMode">{{ $t('gestaoBotaoFraseModo') }}</label>
            <select id="selectMode" v-model="gridElement.mode">
                <option v-for="mode in GridElementCollect.MODES" :value="mode">{{ $t(mode) }}</option>
            </select>
        </div>
        <label class="g-marcar">
            <input id="showLabel" type="checkbox" v-model="gridElement.showLabels" :disabled="!autoOrSeparatedMode"/>
            <span>{{ $t('gestaoBotaoFraseMostrarTexto') }}</span>
        </label>
        <label class="g-marcar">
            <input id="showLongLabels" type="checkbox" v-model="gridElement.showFullLabels"/>
            <span>{{ $t('gestaoBotaoFraseTextoInteiro') }}</span>
        </label>
        <label class="g-marcar">
            <input id="useSingleLine" type="checkbox" v-model="gridElement.singleLine" :disabled="!autoOrSeparatedMode"/>
            <span>{{ $t('gestaoBotaoFraseUmaLinha') }}</span>
        </label>

        <details class="gm-avancado">
            <summary>{{ $t('gestaoMaisOpcoes') }}</summary>
            <div class="gm-avancado-corpo">
                <div class="gm-grade">
                    <div class="g-campo">
                        <label for="imageHeight">{{ $t('gestaoBotaoFraseAlturaFiguras') }}</label>
                        <input id="imageHeight" type="number" min="50" max="100" :disabled="!gridElement.showLabels || !autoOrSeparatedMode" v-model.number="gridElement.imageHeightPercentage"/>
                        <span class="g-dica">{{ $t('gestaoBotaoFraseAlturaDica') }}</span>
                    </div>
                    <div class="g-campo">
                        <label for="singleTextElemFactor">{{ $t('gestaoBotaoFraseTamanhoSoTexto') }}</label>
                        <input id="singleTextElemFactor" type="number" min="0" max="5" step="0.1" :disabled="!autoOrSeparatedMode" v-model.number="gridElement.textElemSizeFactor"/>
                        <span class="g-dica">{{ $t('gestaoBotaoFraseTamanhoDica') }}</span>
                    </div>
                </div>
                <label class="g-marcar">
                    <input id="displayUpsideDown" type="checkbox" v-model="gridElement.displayUpsideDown"/>
                    <span>{{ $t('gestaoBotaoFraseDeCabeca') }}</span>
                </label>
                <label class="g-marcar">
                    <input id="convertToLowercase" type="checkbox" v-model="gridElement.convertToLowercase"/>
                    <span>{{ $t('gestaoBotaoFraseMinusculas') }}</span>
                </label>
            </div>
        </details>
    </div>
</template>

<script>
    import './../../css/modal.css';
    import {GridElementCollect} from "../../js/model/GridElementCollect.js";

    export default {
        props: ['gridElement'],
        data: function () {
            return {
                GridElementCollect: GridElementCollect
            }
        },
        computed: {
            autoOrSeparatedMode: function () {
                return [GridElementCollect.MODE_AUTO, GridElementCollect.MODE_COLLECT_SEPARATED].includes(this.gridElement.mode);
            }
        },
        methods: {
        },
        mounted() {
        },
        beforeDestroy() {
        }
    }
</script>

<style scoped>
.ec-intro, .eyt-intro, .emx-intro { display: flex; align-items: flex-start; gap: var(--g-e2); margin: 0 0 var(--g-e4); }
.eyt-intro .ti, .emx-intro .ti { font-size: 1.4em; color: var(--g-folha-escura); flex: none; }
.eyt-sub { display: block; font-weight: 400; }
</style>
