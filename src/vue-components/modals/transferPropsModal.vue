<template>
    <gestao-modal :titulo="$t('gestaoEdicaoCopiarTitulo')" icone="brush" tamanho="m"
                  @close="$emit('close')" @keyup.ctrl.enter.native="save()">
        <div v-if="gridElement">
            <div class="tp-botao">
                <span class="tp-botao-rotulo">{{ $t('gestaoEdicaoCopiarDe') }}</span>
                <edit-element-header :grid-element="gridElement"></edit-element-header>
            </div>
            <ol class="tp-passos">
                <li><span class="tp-num" aria-hidden="true">1</span>{{ $t('gestaoEdicaoCopiarPasso1') }}</li>
                <li><span class="tp-num" aria-hidden="true">2</span>{{ $t('gestaoEdicaoCopiarPasso2') }}</li>
            </ol>

            <section class="gm-secao">
                <h3><i class="ti ti-palette" aria-hidden="true"></i>{{ $t('gestaoEdicaoCopiarAparencia') }}</h3>
                <transfer-props-list-header/>
                <ul class="tp-lista">
                    <transfer-props-elem v-for="key in Object.keys(PROPS).filter(k => PROPS[k].category === CATEGORIES.APPEARANCE)" :key="key"
                                         :prop-object="PROPS[key]" :grid-element="gridElement" @change="(transfer) => selectProp(transfer, PROPS[key])"/>
                </ul>
            </section>
            <section class="gm-secao">
                <h3><i class="ti ti-adjustments" aria-hidden="true"></i>{{ $t('gestaoEdicaoCopiarOutros') }}</h3>
                <transfer-props-list-header/>
                <ul class="tp-lista">
                    <transfer-props-elem v-for="key in Object.keys(PROPS).filter(k => PROPS[k].category === CATEGORIES.OTHERS)" :key="key"
                                         :prop-object="PROPS[key]" :grid-element="gridElement" @change="(transfer) => selectProp(transfer, PROPS[key])"/>
                </ul>
            </section>
        </div>
        <p v-else class="gm-vazio"><i class="ti ti-loader-2" aria-hidden="true"></i>{{ $t('gestaoEdicaoCarregando') }}</p>

        <template #rodape>
            <button type="button" class="g-btn" @click="$emit('close')" :title="$t('keyboardEsc')">{{ $t('gestaoCancelar') }}</button>
            <button type="button" class="g-btn g-btn-principal" :disabled="!anySelected" @click="save()" :title="$t('keyboardCtrlEnter')">
                <i class="ti ti-copy" aria-hidden="true"></i>{{ $t('gestaoEdicaoCopiar') }}
            </button>
        </template>
    </gestao-modal>
</template>

<script>
import GestaoModal from "./gestaoModal.vue";
import {dataService} from "../../js/service/data/dataService";
import EditElementHeader from "../components/editElementHeader.vue";
import TransferPropsElem from './transferPropsElem.vue';
import { constants } from '../../js/util/constants';
import { gridUtil } from '../../js/util/gridUtil';
import TransferPropsListHeader from './transferPropsListHeader.vue';

export default {
    components: { TransferPropsListHeader, TransferPropsElem, EditElementHeader, GestaoModal},
    props: ['gridId', 'gridElementId'],
    data: function () {
        return {
            gridData: null,
            gridElement: null,
            transferObject: gridUtil.getPropTransferObjectBase(),
            PROPS: constants.TRANSFER_PROPS,
            CATEGORIES: constants.PROP_TRANSFER_CATEGORIES
        }
    },
    computed: {
        anySelected() {
            return !gridUtil.getAllPropTransferPaths().every(path => this.transferObject[path] === constants.PROP_TRANSFER_DONT_CHANGE)
        }
    },
    methods: {
        selectProp(transfer, propObject) {
            if (transfer) {
                this.$set(this.transferObject, propObject.path, this.gridElement[propObject.path]);
            } else {
                this.$set(this.transferObject, propObject.path, constants.PROP_TRANSFER_DONT_CHANGE);
            }
        },
        save() {
            if (this.anySelected) {
                this.$emit('start', this.transferObject);
            }
            this.$emit('close');
        },
        close() {
            this.$emit('close');
        }
    },
    async mounted() {
        dataService.getGrid(this.gridId).then(gridData => {
            this.gridData = JSON.parse(JSON.stringify(gridData));
            this.gridElement = this.gridData.gridElements.find(e => e.id === this.gridElementId);
        });
    }
}
</script>

<style scoped>
.tp-botao {
    display: flex; flex-wrap: wrap; align-items: center; gap: var(--g-e2) var(--g-e3);
    background: var(--g-superficie); border: 2px solid var(--g-borda); border-radius: var(--g-raio);
    padding: var(--g-e2) var(--g-e4); margin-bottom: var(--g-e4);
}
.tp-botao-rotulo { color: var(--g-tinta-2); font-size: var(--g-t-legenda); font-weight: 700; }
.tp-botao > :last-child { flex: 1; min-width: 0; margin: 0 !important; }
.tp-passos { list-style: none; margin: 0 0 var(--g-e4); padding: 0; display: flex; flex-direction: column; gap: var(--g-e2); }
.tp-passos > li { display: flex; align-items: center; gap: var(--g-e3); margin: 0; }
.tp-num {
    flex: none; width: 32px; height: 32px; border-radius: 50%; display: grid; place-items: center;
    background: var(--g-girassol); color: var(--g-tinta); font-weight: 700;
}
.tp-lista { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: var(--g-e2); }
</style>
