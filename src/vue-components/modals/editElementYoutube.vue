<template>
    <div class="eyt" v-if="gridElement">
        <p class="g-apoio eyt-intro"><i class="ti ti-brand-youtube" aria-hidden="true"></i>{{ $t('gestaoBotaoVideoIntro') }}</p>
        <label class="g-marcar">
            <input id="preventClick" type="checkbox" v-model="gridElement.additionalProps[GridElement.PROP_YT_PREVENT_CLICK]"/>
            <span>{{ $t('gestaoBotaoVideoSemToque') }}<small class="g-dica eyt-sub">{{ $t('gestaoBotaoVideoSemToqueDica') }}</small></span>
        </label>
    </div>
</template>

<script>
    import './../../css/modal.css';
    import {GridElement} from "../../js/model/GridElement.js";

    export default {
        props: ['gridElement'],
        data: function () {
            return {
                GridElement: GridElement
            }
        },
        methods: {
        },
        mounted() {
            this.gridElement.additionalProps[GridElement.PROP_YT_PREVENT_CLICK] = this.gridElement.additionalProps[GridElement.PROP_YT_PREVENT_CLICK] || false;
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
