<template>
    <li class="tpe">
        <label class="g-marcar tpe-marcar" :for="'transfer1' + propObject.path">
            <input :id="'transfer1' + propObject.path" type="checkbox" @change="changed($event)"/>
            <span>{{ rotulo }}</span>
        </label>
        <div class="tpe-valor">
            <span class="g-oculto-leitor">{{ $t('gestaoEdicaoCopiarAgora') }}:</span>
            <span v-if="[undefined, null].includes(gridElement[propObject.path]) && propObject.type !== TYPES.BOOLEAN" class="tpe-nada">{{ $t('gestaoEdicaoCopiarSemValor') }}</span>
            <template v-if="![undefined, null].includes(gridElement[propObject.path]) || propObject.type === TYPES.BOOLEAN">
                <template v-if="propObject.type === TYPES.BOOLEAN">
                    <span v-if="gridElement[propObject.path]" class="tpe-sim"><i class="ti ti-square-check" aria-hidden="true"></i>{{ $t('gestaoEdicaoSim') }}</span>
                    <span v-if="!gridElement[propObject.path]" class="tpe-nao"><i class="ti ti-square" aria-hidden="true"></i>{{ $t('gestaoEdicaoNao') }}</span>
                </template>
                <span v-if="propObject.type === TYPES.PERCENTAGE">{{ gridElement[propObject.path] }}%</span>
                <span v-if="propObject.type === TYPES.NUMBER">{{ gridElement[propObject.path] }}</span>
                <span v-if="propObject.type === TYPES.TEXT">{{ $t(gridElement[propObject.path]) }}</span>
                <span v-if="propObject.type === TYPES.COLOR" class="tpe-cor">
                    <span class="tpe-amostra" :style="`background-color: ${gridElement[propObject.path]}; color: ${fontUtil.getHighContrastColor(gridElement[propObject.path])}`" aria-hidden="true">Aa</span>
                    <span>{{ gridElement[propObject.path] }}</span>
                </span>
            </template>
        </div>
    </li>
</template>

<script>
import { fontUtil } from '../../js/util/fontUtil';
import { constants } from '../../js/util/constants';

// só apresentação: nomes simples para as características copiadas (cai no texto antigo se não houver)
const ROTULOS = {
    colorCategory: 'gestaoEdicaoPropCategoria',
    customBackgroundColor: 'gestaoEdicaoPropFundo',
    customBorderColor: 'gestaoEdicaoPropBorda',
    fontColor: 'gestaoEdicaoPropCorLetra',
    fontSize: 'gestaoEdicaoPropTamanhoLetra',
    hideElement: 'gestaoEdicaoPropEsconder',
    vocabularyLevel: 'gestaoEdicaoPropNivel',
    addElementToCollectElement: 'gestaoEdicaoPropFrase',
    toggleInCollectionElementIfAddedMultipleTimes: 'gestaoEdicaoPropAlternar'
};

export default {
    components: {},
    props: ['propObject', 'gridElement'],
    data: function () {
        return {
            TYPES: constants.PROP_TRANSFER_TYPES,
            fontUtil: fontUtil
        }
    },
    computed: {
        rotulo() {
            let chave = ROTULOS[this.propObject.label];
            return chave ? this.$t(chave) : this.$t(this.propObject.label);
        }
    },
    methods: {
        changed(event) {
            this.$emit('change', event.target.checked);
        }
    },
    async mounted() {
    }
}
</script>

<style scoped>
.tpe {
    display: flex; flex-wrap: wrap; align-items: center; gap: var(--g-e1) var(--g-e3);
    margin: 0; padding: var(--g-e1) var(--g-e3);
    background: var(--g-superficie); border: 2px solid var(--g-borda); border-radius: var(--g-raio);
}
.tpe:focus-within { border-color: var(--g-folha); }
.tpe-marcar { flex: 1 1 220px; min-width: 0; align-items: center; margin: 0 !important; padding: var(--g-e1) 0; }
.tpe-marcar input { margin: 0; }
.tpe-marcar > span { overflow-wrap: anywhere; }
.tpe-valor {
    flex: 0 1 auto; display: flex; align-items: center; gap: var(--g-e2);
    color: var(--g-tinta-2); font-size: var(--g-t-legenda); padding-left: 36px; min-height: 32px;
}
.tpe-valor .ti { font-size: 1.3em; }
.tpe-sim, .tpe-nao, .tpe-cor { display: inline-flex; align-items: center; gap: var(--g-e1); }
.tpe-sim .ti { color: var(--g-folha-escura); }
.tpe-nada { font-style: italic; color: var(--g-tinta-3); }
.tpe-amostra {
    display: inline-grid; place-items: center; width: 40px; height: 28px; border-radius: var(--g-raio-p);
    border: 1px solid var(--g-borda-forte); font-weight: 700;
}
@media (min-width: 601px) {
    .tpe-valor { padding-left: 0; justify-content: flex-end; min-width: 150px; }
}
</style>
