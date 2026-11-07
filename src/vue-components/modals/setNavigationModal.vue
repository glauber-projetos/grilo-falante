<template>
    <gestao-modal :titulo="$t('gestaoEdicaoNavTitulo')" :subtitulo="$t('gestaoEdicaoNavSubtitulo')" icone="door-enter" tamanho="g"
                  @close="$emit('close')" @keyup.ctrl.enter.native="save()">
        <template #cabeca>
            <button type="button" class="g-btn g-btn-leve g-btn-icone" @click="openHelp" :aria-label="$t('gestaoEdicaoAjuda')" :title="$t('gestaoEdicaoAjuda')">
                <i class="ti ti-help" aria-hidden="true"></i>
            </button>
        </template>

        <div v-if="gridElement">
            <div class="sn-botao">
                <span class="sn-botao-rotulo">{{ $t('gestaoEdicaoEsteBotao') }}</span>
                <edit-element-header :grid-element="gridElement"></edit-element-header>
            </div>

            <grid-selector v-model="selectedGrid" :exclude-id="gridId" :select-label="$t('gestaoEdicaoNavEscolha')" :additional-select-options="[NAV_CREATE_NEW_GRID]"></grid-selector>

            <section class="gm-secao sn-nova" v-if="selectedGrid === NAV_CREATE_NEW_GRID">
                <div class="g-campo">
                    <label for="gridName">{{ $t('gestaoEdicaoNavNomeNova') }}</label>
                    <input id="gridName" v-model="newName" @change="newName = modelUtil.getNewName(newName, existingGridNames)" autocomplete="off" v-focus type="text" maxlength="40"/>
                    <span class="g-dica">{{ $t('gestaoEdicaoNavNomeNovaDica') }}</span>
                </div>
            </section>
        </div>
        <p v-else class="gm-vazio"><i class="ti ti-loader-2" aria-hidden="true"></i>{{ $t('gestaoEdicaoCarregando') }}</p>

        <template #rodape>
            <button type="button" class="g-btn" @click="$emit('close')" :title="$t('keyboardEsc')">{{ $t('gestaoCancelar') }}</button>
            <button type="button" class="g-btn g-btn-principal" @click="save()" :disabled="!gridElement || (selectedGrid === NAV_CREATE_NEW_GRID && !newName)" :title="$t('keyboardCtrlEnter')">
                <i class="ti ti-check" aria-hidden="true"></i>{{ $t('gestaoSalvar') }}
            </button>
        </template>
    </gestao-modal>
</template>

<script>
import {i18nService} from "../../js/service/i18nService";
import GestaoModal from "./gestaoModal.vue";
import {dataService} from "../../js/service/data/dataService";
import {imageUtil} from "../../js/util/imageUtil";
import GridSelector from "../components/gridSelector.vue";
import EditElementHeader from "../components/editElementHeader.vue";
import {helpService} from "../../js/service/helpService.js";
import {modelUtil} from "../../js/util/modelUtil.js";
import {GridActionNavigate} from "../../js/model/GridActionNavigate.js";
import {GridData} from "../../js/model/GridData.js";

export default {
    components: {EditElementHeader, GridSelector, GestaoModal},
    props: ['gridId', 'gridElementId'],
    data: function () {
        return {
            gridData: null,
            gridElement: null,
            selectedGrid: null,
            moveAllElements: false,
            i18nService: i18nService,
            imageUtil: imageUtil,
            existingGridNames: [],
            newName: '',
            modelUtil: modelUtil,
            NAV_CREATE_NEW_GRID: "NAV_CREATE_NEW_GRID"
        }
    },
    methods: {
        addGrid() {

        },
        save() {
            if (this.selectedGrid === this.NAV_CREATE_NEW_GRID && !this.newName) {
                return;
            }
            this.saveInternal().then(() => {
                this.$emit('reload', this.gridData);
                this.$emit('close');
            });
        },
        async saveInternal() {
            let gridId = null;
            let label = null;
            if (this.selectedGrid === this.NAV_CREATE_NEW_GRID) {
                let newGrid = new GridData({
                    label: i18nService.getTranslationObject(this.newName),
                    gridElements: []
                });
                await dataService.saveGrid(newGrid);
                gridId = newGrid.id;
                label = this.newName;
            } else {
                gridId = this.selectedGrid.id;
                label = i18nService.getTranslation(this.selectedGrid.label);
            }
            this.gridElement.actions = this.gridElement.actions.filter(action => action.modelName !== GridActionNavigate.getModelName());
            let navAction = new GridActionNavigate({
                toGridId: gridId,
                navType: GridActionNavigate.NAV_TYPES.TO_GRID
            });
            if (!i18nService.getTranslation(this.gridElement.label)) {
                this.gridElement.label = this.gridElement.label || {};
                this.gridElement.label[i18nService.getContentLang()] = label;
            }
            this.gridElement.actions.push(navAction);
            await dataService.saveGrid(this.gridData);
        },
        openHelp() {
            helpService.openHelp();
        },
        close() {
            this.$emit('close');
        }
    },
    async mounted() {
        dataService.getGrid(this.gridId).then(gridData => {
            this.gridData = JSON.parse(JSON.stringify(gridData));
            this.gridElement = this.gridData.gridElements.filter(e => e.id === this.gridElementId)[0];
        });
        let grids = await dataService.getGrids(false);
        this.existingGridNames = grids.map(grid => i18nService.getTranslation(grid.label));
    }
}
</script>

<style scoped>
.sn-botao {
    display: flex; flex-wrap: wrap; align-items: center; gap: var(--g-e2) var(--g-e3);
    background: var(--g-superficie); border: 2px solid var(--g-borda); border-radius: var(--g-raio);
    padding: var(--g-e2) var(--g-e4); margin-bottom: var(--g-e4);
}
.sn-botao-rotulo { color: var(--g-tinta-2); font-size: var(--g-t-legenda); font-weight: 700; }
.sn-botao > :last-child { flex: 1; min-width: 0; margin: 0 !important; }
.sn-nova { margin-top: var(--g-e2); }
</style>
