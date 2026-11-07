<template>
    <div class="eeh">
        <div v-if="gridElement" class="eeh-previa" role="img" :aria-label="$t('gestaoBotaoPreviaDe', [textoPrevia])" :title="$t('gestaoBotaoPrevia')"
             :style="{backgroundColor: corFundo, color: corLetra, borderColor: corBorda}">
            <img v-if="temImagem" class="eeh-img" :src="gridElement.image.data || gridElement.image.url" alt=""/>
            <span class="eeh-texto" :class="{'eeh-texto-so': !temImagem}">{{ textoPrevia }}</span>
        </div>
        <h2 v-if="header" name="header" class="eeh-titulo">{{ header }}</h2>
        <button v-if="openHelpFn" type="button" class="g-btn g-btn-leve g-btn-icone" @click="openHelpFn" :aria-label="$t('gestaoBotaoAjuda')" :title="$t('gestaoBotaoAjuda')">
            <i class="ti ti-help" aria-hidden="true"></i>
        </button>
        <button v-if="closeFn" id="closeLink" type="button" class="g-btn g-btn-leve g-btn-icone" @click="closeFn" :aria-label="$t('gestaoFechar')" :title="$t('gestaoFechar')">
            <i class="ti ti-x" aria-hidden="true"></i>
        </button>
    </div>
</template>

<script>

    import {GridElement} from "../../js/model/GridElement.js";
    import {dataService} from "../../js/service/data/dataService.js";
    import {colorUtil} from "../../js/util/colorUtil.js";
    import {i18nService} from "../../js/service/i18nService.js";

    export default {
        props: ["header", "gridElement", "openHelpFn", "closeFn"],
        data() {
            return {
                GridElement: GridElement,
                metadata: null
            }
        },
        computed: {
            temImagem() {
                let img = this.gridElement && this.gridElement.image;
                return !!(img && (img.data || img.url));
            },
            textoPrevia() {
                if (!this.gridElement) return '';
                if (this.gridElement.type && this.gridElement.type !== GridElement.ELEMENT_TYPE_NORMAL && this.gridElement.type !== GridElement.ELEMENT_TYPE_LIVE) {
                    return i18nService.t(this.gridElement.type);
                }
                return i18nService.getTranslation(this.gridElement.label) || '';
            },
            corFundo() {
                return colorUtil.getBackgroundColor(this.gridElement, this.metadata) || '#ffffff';
            },
            corLetra() {
                return this.gridElement.fontColor || colorUtil.getFontColor(this.metadata, this.corFundo);
            },
            corBorda() {
                return this.metadata ? colorUtil.getBorderColor(this.gridElement, this.metadata) : 'transparent';
            }
        },
        mounted() {
            dataService.getMetadata().then(metadata => {
                this.metadata = metadata;
            });
        },
    }
</script>

<style scoped>
.eeh { display: flex; align-items: center; gap: var(--g-e3); min-width: 0; }
.eeh-previa {
    flex: none;
    width: 72px; height: 72px;
    border-radius: var(--g-raio-p);
    border: 3px solid transparent;
    background: var(--g-superficie);
    box-shadow: 0 0 0 1px var(--g-borda);
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    padding: 3px; gap: 2px; overflow: hidden;
}
.eeh-img { flex: 1; min-height: 0; max-width: 100%; object-fit: contain; }
.eeh-texto {
    font-size: 12px; font-weight: 700; line-height: 1.1; max-width: 100%;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap; text-align: center;
}
.eeh-texto-so { font-size: 14px; white-space: normal; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; }
.eeh-titulo { flex: 1; min-width: 0; margin: 0; font-size: var(--g-t-h3); overflow-wrap: anywhere; }
@media (max-width: 600px) {
    .eeh-previa { width: 56px; height: 56px; }
}
</style>
