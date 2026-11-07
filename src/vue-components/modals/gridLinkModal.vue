<template>
    <gestao-modal :titulo="$t('gestaoEdicaoLigarTitulo')" icone="link" tamanho="m"
                  @close="$emit('close')" @keyup.ctrl.enter.native="save()">
        <div v-if="gridFrom">
            <div class="gl-pranchas">
                <figure class="gl-prancha">
                    <img :src="gridFrom.thumbnail ? gridFrom.thumbnail.data : imageUtil.getEmptyImage()" alt=""/>
                    <figcaption>{{gridFrom.label | extractTranslation}}</figcaption>
                </figure>
                <i class="ti ti-arrow-right gl-seta" aria-hidden="true"></i>
                <figure class="gl-prancha">
                    <img :src="gridTo.thumbnail ? gridTo.thumbnail.data : imageUtil.getEmptyImage()" alt=""/>
                    <figcaption>{{gridTo.label | extractTranslation}}</figcaption>
                </figure>
            </div>
            <div class="g-campo">
                <label for="elementName">{{ $t('gestaoEdicaoLigarQualBotao') }}</label>
                <select id="elementName" v-model="selectedElement">
                    <option :value="null">{{ $t('gestaoEdicaoLigarBotaoNovo') }}</option>
                    <option v-for="elem in gridFrom.gridElements" :value="elem">{{i18nService.getTranslation(elem.label) || $t('gestaoEdicaoBotaoSemTexto')}}</option>
                </select>
            </div>
            <div class="g-campo" v-show="!selectedElement || !i18nService.getTranslation(selectedElement.label)">
                <label for="elementLabel">{{ $t('gestaoEdicaoLigarTextoNovo') }}</label>
                <input type="text" id="elementLabel" v-model="newElementLabel[i18nService.getContentLang()]" maxlength="35"/>
            </div>
            <div class="g-aviso" v-show="selectedElement && selectedElement.actions.filter(e => e.modelName === GridActionNavigate.getModelName()).length > 0">
                <i class="ti ti-alert-triangle" aria-hidden="true"></i>
                <span>{{ $t('gestaoEdicaoLigarJaAbre') }}</span>
            </div>
        </div>
        <p v-else class="gm-vazio"><i class="ti ti-loader-2" aria-hidden="true"></i>{{ $t('gestaoEdicaoCarregando') }}</p>

        <template #rodape>
            <button type="button" class="g-btn" @click="$emit('close')" :title="$t('keyboardEsc')">{{ $t('gestaoCancelar') }}</button>
            <button type="button" class="g-btn g-btn-principal" @click="save()" :disabled="!gridFrom" :title="$t('keyboardCtrlEnter')">
                <i class="ti ti-check" aria-hidden="true"></i>{{ $t('gestaoSalvar') }}
            </button>
        </template>
    </gestao-modal>
</template>

<script>
    import {i18nService} from "../../js/service/i18nService";
    import GestaoModal from './gestaoModal.vue';
    import {imageUtil} from "../../js/util/imageUtil";
    import {GridActionNavigate} from "../../js/model/GridActionNavigate";
    import {GridElement} from "../../js/model/GridElement";
    import {GridData} from "../../js/model/GridData";
    import {dataService} from "../../js/service/data/dataService";

    export default {
        components: {GestaoModal},
        props: ['gridFromProp', 'gridToProp'],
        data: function () {
            return {
                gridFrom: null,
                gridTo: JSON.parse(JSON.stringify(this.gridToProp)),
                inputText: "",
                selectedElement: null,
                newElementLabel: null,
                GridActionNavigate: GridActionNavigate,
                imageUtil: imageUtil,
                i18nService: i18nService
            }
        },
        methods: {
            save() {
                this.saveInternal().then(() => {
                    this.$emit('reload');
                    this.$emit('close');
                });
            },
            saveInternal() {
                let element = this.selectedElement;
                if (!element) {
                    let newPos = new GridData(this.gridFrom).getNewXYPos();
                    element = new GridElement({
                        label: this.newElementLabel,
                        x: newPos.x,
                        y: newPos.y
                    });
                    this.gridFrom.gridElements.push(element);
                }
                element.label = element.label || this.newElementLabel;
                element.actions = element.actions.filter(a => a.modelName !== GridActionNavigate.getModelName());
                element.actions.push(new GridActionNavigate({
                    toGridId: this.gridTo.id,
                    navType: GridActionNavigate.NAV_TYPES.TO_GRID
                }));
                return dataService.saveGrid(this.gridFrom);
            }
        },
        mounted() {
            this.newElementLabel = JSON.parse(JSON.stringify(this.gridTo.label));
            dataService.getGrid(this.gridFromProp.id).then(gridFrom => {
                this.gridFrom = JSON.parse(JSON.stringify(gridFrom));
            });
        }
    }
</script>

<style scoped>
.gl-pranchas { display: flex; align-items: center; justify-content: center; gap: var(--g-e3); flex-wrap: wrap; margin-bottom: var(--g-e5); }
.gl-prancha {
    flex: 1 1 160px; max-width: 260px; margin: 0; display: flex; flex-direction: column; gap: var(--g-e2);
    background: var(--g-superficie); border: 2px solid var(--g-borda); border-radius: var(--g-raio); padding: var(--g-e2);
}
.gl-prancha img { width: 100%; aspect-ratio: 4 / 3; object-fit: contain; background: var(--g-superficie-2); border-radius: var(--g-raio-p); }
.gl-prancha figcaption { font-weight: 700; text-align: center; overflow-wrap: anywhere; }
.gl-seta { font-size: 32px; color: var(--g-folha-escura); flex: none; }
@media (max-width: 600px) {
    .gl-pranchas { flex-direction: column; }
    .gl-prancha { width: 100%; max-width: 240px; flex-basis: auto; }
    .gl-seta { transform: rotate(90deg); }
}
</style>
