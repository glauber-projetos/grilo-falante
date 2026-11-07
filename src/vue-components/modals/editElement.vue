<template>
    <gestao-modal tamanho="g" icone="pencil" :titulo="editElementId ? $t('gestaoBotaoEditarTitulo') : $t('gestaoBotaoNovoTitulo')"
                  @close="$emit('close')"
                  @keydown.native.ctrl.enter="save()" @keydown.native.ctrl.right="nextFromKeyboard()" @keydown.native.ctrl.left="editNext(true)" @keydown.native.ctrl.y="save(true)">
        <template #cabeca>
            <button type="button" class="g-btn g-btn-leve g-btn-icone" @click="openHelp" :aria-label="$t('gestaoBotaoAjuda')" :title="$t('gestaoBotaoAjuda')">
                <i class="ti ti-help" aria-hidden="true"></i>
            </button>
        </template>

        <template #abas>
            <div class="ee-topo" v-if="gridElement">
                <edit-element-header :grid-element="gridElement"></edit-element-header>
                <div v-if="abas.length > 1" class="gm-abas ee-abas" role="tablist" :aria-label="$t('gestaoBotaoPartes')">
                    <button v-for="aba in abas" :key="aba.id" type="button" role="tab" class="gm-aba" :id="'ee-aba-' + aba.id"
                            aria-controls="ee-painel" :aria-selected="(currentTab === aba.id).toString()" @click="escolherAba(aba.id)">
                        <i :class="'ti ti-' + aba.icone" aria-hidden="true"></i>{{ aba.texto }}
                    </button>
                </div>
                <p v-else-if="abas.length === 1" class="ee-so-uma"><i :class="'ti ti-' + abas[0].icone" aria-hidden="true"></i>{{ abas[0].texto }}</p>
            </div>
        </template>

        <div v-if="gridElement" id="ee-painel" :role="abas.length > 1 ? 'tabpanel' : null" :aria-labelledby="abas.length > 1 ? 'ee-aba-' + currentTab : null">
            <div v-if="currentTab === TABS.TAB_GENERAL">
                <edit-element-general v-if="gridElement.type === GridElement.ELEMENT_TYPE_NORMAL || gridElement.type === GridElement.ELEMENT_TYPE_LIVE" :grid-element="gridElement" :grid-data="gridData" @searchImage="toImageSearch"></edit-element-general>
                <edit-element-youtube v-if="gridElement.type === GridElement.ELEMENT_TYPE_YT_PLAYER" :grid-element="gridElement"></edit-element-youtube>
                <edit-element-collect v-if="gridElement.type === GridElement.ELEMENT_TYPE_COLLECT" :grid-element="gridElement"></edit-element-collect>
                <edit-element-matrix v-if="gridElement.type === GridElement.ELEMENT_TYPE_MATRIX_CONVERSATION" :grid-element="gridElement"></edit-element-matrix>
            </div>
            <edit-element-live v-if="currentTab === TABS.TAB_LIVE_DATA" :grid-element="gridElement"></edit-element-live>
            <edit-element-image v-if="currentTab === TABS.TAB_IMAGE" :grid-element="gridElement" :grid-data="gridData" :image-search="imageSearch"></edit-element-image>
            <edit-element-word-forms v-if="currentTab === TABS.TAB_WORDFORMS" :grid-element="gridElement" :grid-data="gridData" @reloadData="initInternal(true)"></edit-element-word-forms>
            <edit-element-actions v-if="currentTab === TABS.TAB_ACTIONS" :grid-element="gridElement" :grid-data="gridData"></edit-element-actions>
        </div>
        <div v-else class="gm-vazio">
            <i class="ti ti-loader-2 ee-gira" aria-hidden="true"></i>
            <span>{{ $t('gestaoBotaoCarregando') }}</span>
        </div>

        <template #rodape>
            <div class="gm-rodape-esq ee-extras" v-if="gridElement">
                <template v-if="editElementId">
                    <button type="button" class="g-btn g-btn-leve" @click="editNext(true)" :title="$t('keyboardCtrlLeft')">
                        <i class="ti ti-chevrons-left" aria-hidden="true"></i>{{ $t('gestaoBotaoSalvarAnterior') }}
                    </button>
                    <button type="button" class="g-btn g-btn-leve" @click="editNext()" :title="$t('keyboardCtrlRight')">
                        {{ $t('gestaoBotaoSalvarProximo') }}<i class="ti ti-chevrons-right" aria-hidden="true"></i>
                    </button>
                </template>
                <button v-else type="button" class="g-btn g-btn-leve" @click="addNext()" :title="$t('keyboardCtrlRight')">
                    <i class="ti ti-plus" aria-hidden="true"></i>{{ $t('gestaoBotaoSalvarCriarOutro') }}
                </button>
            </div>
            <button type="button" class="g-btn" @click="$emit('close')" :title="$t('keyboardEsc')">{{ $t('gestaoCancelar') }}</button>
            <button type="button" class="g-btn g-btn-principal" @click="save()" :disabled="!gridElement" :title="$t('keyboardCtrlEnter')">
                <i class="ti ti-check" aria-hidden="true"></i>{{ $t('gestaoSalvar') }}
            </button>
        </template>
    </gestao-modal>
</template>

<script>
    import {dataService} from '../../js/service/data/dataService'
    import {GridImage} from "../../js/model/GridImage";
    import './../../css/modal.css';
    import {GridElement} from "../../js/model/GridElement";
    import {GridData} from "../../js/model/GridData";
    import {helpService} from "../../js/service/helpService";
    import {util} from "../../js/util/util";
    import GestaoModal from "./gestaoModal.vue";
    import EditElementGeneral from "./editElementGeneral.vue";
    import EditElementImage from "./editElementImage.vue";
    import EditElementActions from "./editElementActions.vue";
    import EditElementYoutube from "./editElementYoutube.vue";
    import {i18nService} from "../../js/service/i18nService.js";
    import EditElementCollect from "./editElementCollect.vue";
    import EditElementHeader from "../components/editElementHeader.vue";
    import EditElementWordForms from "./editElementWordForms.vue";
    import EditElementLive from './editElementLive.vue';
    import EditElementMatrix from './editElementMatrix.vue';
    import { gridLayoutUtil } from '../grid-layout/utils/gridLayoutUtil';

    const TAB_GENERAL = 'TAB_GENERAL';
    const TAB_IMAGE = 'TAB_IMAGE';
    const TAB_WORDFORMS = 'TAB_WORDFORMS';
    const TAB_ACTIONS = 'TAB_ACTIONS';
    const TAB_LIVE_DATA = 'TAB_LIVE_DATA';
    const TABS = {TAB_GENERAL, TAB_IMAGE, TAB_WORDFORMS, TAB_ACTIONS, TAB_LIVE_DATA};

    export default {
        props: ['editElementIdParam', 'gridDataId', 'undoService', 'newPosition'],
        components: {
            EditElementMatrix,
            EditElementLive,
            EditElementWordForms,
            EditElementHeader,
            EditElementCollect,
            GestaoModal, EditElementGeneral, EditElementImage, EditElementActions, EditElementYoutube
        },
        data: function () {
            return {
                gridData: null,
                originalGridData: null,
                gridElement: null,
                originalGridElement: null,
                editElementId: null,
                TABS: TABS,
                possibleTabs: {},
                currentTab: TAB_GENERAL,
                imageSearch: null,
                GridElement: GridElement
            }
        },
        computed: {
            abas() {
                // só apresentação: texto e ícone de cada aba que já existe em possibleTabs
                let tipoComTexto = this.gridElement && [GridElement.ELEMENT_TYPE_NORMAL, GridElement.ELEMENT_TYPE_LIVE].includes(this.gridElement.type);
                let info = {
                    TAB_GENERAL: tipoComTexto ? {icone: 'forms', texto: 'gestaoBotaoAbaTexto'} : {icone: 'adjustments', texto: 'gestaoBotaoAbaAjustes'},
                    TAB_IMAGE: {icone: 'photo', texto: 'gestaoBotaoAbaImagem'},
                    TAB_WORDFORMS: {icone: 'abc', texto: 'gestaoBotaoAbaFormas'},
                    TAB_ACTIONS: {icone: 'hand-finger', texto: 'gestaoBotaoAbaAcoes'},
                    TAB_LIVE_DATA: {icone: 'activity', texto: 'gestaoBotaoAbaAoVivo'}
                };
                return Object.keys(this.possibleTabs).map(id => ({id: id, icone: info[id].icone, texto: i18nService.t(info[id].texto)}));
            }
        },
        watch: {
            possibleTabs(novas) {
                // antes feito pelo nav-tabs: se só existe uma aba, ela fica escolhida
                let ids = Object.keys(novas);
                if (ids.length === 1 || (ids.length && !ids.includes(this.currentTab))) {
                    this.escolherAba(ids[0]);
                }
            }
        },
        methods: {
            escolherAba(id) {
                this.currentTab = id;
                this.imageSearch = '';
            },
            toImageSearch() {
                this.imageSearch = i18nService.getTranslation(this.gridElement.label);
                this.currentTab = TABS.TAB_IMAGE;
            },
            save(toActions) {
                this.saveInternal().then((savedSomething) => {
                    this.$emit('close');
                    if (savedSomething) {
                        this.$emit('reload', this.gridData);
                    }
                    if (savedSomething && !this.editElementId) {
                        this.$emit('mark', this.gridElement.id);
                    }
                    if (toActions) {
                        this.$emit('actions', this.gridElement.id);
                    }
                });
            },
            addNext() {
                var thiz = this;
                thiz.saveInternal().then(() => {
                    this.$emit('reload', this.gridData);
                    thiz.initInternal();
                    $('#inputLabel').focus();
                });
            },
            editNext(invertDirection) {
                var thiz = this;
                if (!thiz.editElementId) return;

                thiz.saveInternal().then((savedSomething) => {
                    if (savedSomething) {
                        this.$emit('reload', this.gridData);
                    }
                    thiz.editElementId = new GridData(thiz.gridData).getNextElementId(thiz.editElementId, invertDirection, thiz.gridElement.type);
                    thiz.initInternal();
                    $('#inputLabel').focus();
                });
            },
            nextFromKeyboard() {
                if (this.editElementId) {
                    this.editNext();
                } else {
                    this.addNext();
                }
            },
            saveInternal() {
                let thiz = this;
                return new Promise(resolve => {
                    if (thiz.gridData && JSON.stringify(thiz.originalGridData) !== JSON.stringify(thiz.gridData)) {
                        thiz.undoService.updateGrid(thiz.gridData).then(updated => {
                            resolve(updated);
                        });
                    } else {
                        resolve(false);
                    }
                });
            },
            initInternal(dontReset) {
                let thiz = this;
                if (!dontReset) thiz.resetInternal();
                dataService.getGrid(thiz.gridDataId).then(gridData => {
                    thiz.gridData = JSON.parse(JSON.stringify(gridData));
                    thiz.originalGridData = JSON.parse(JSON.stringify(gridData));
                    if (thiz.editElementId) {
                        thiz.gridElement = thiz.gridData.gridElements.filter(e => e.id === thiz.editElementId)[0];
                        if (!thiz.gridElement.image) {
                            thiz.gridElement.image = JSON.parse(JSON.stringify(new GridImage()));
                        }
                        thiz.gridElement.label = util.isString(thiz.gridElement.label) ? {} : thiz.gridElement.label;
                    } else {
                        let newXYPos = this.newPosition && this.newPosition.x !== undefined ? this.newPosition : gridData.getNewXYPos();
                        newXYPos = gridLayoutUtil.getNextFreePosition(this.gridData, newXYPos);
                        log.debug('creating element: x ' + newXYPos.x + ' / y ' + newXYPos.y);
                        thiz.gridElement = JSON.parse(JSON.stringify(new GridElement({
                            x: newXYPos.x,
                            y: newXYPos.y
                        })));
                        thiz.gridData.gridElements.push(thiz.gridElement);
                    }
                    if (thiz.gridElement.type === GridElement.ELEMENT_TYPE_NORMAL) {
                        this.possibleTabs = { TAB_GENERAL, TAB_IMAGE, TAB_WORDFORMS, TAB_ACTIONS };
                    } else if (thiz.gridElement.type === GridElement.ELEMENT_TYPE_YT_PLAYER) {
                        this.possibleTabs = { TAB_GENERAL, TAB_ACTIONS };
                    } else if (thiz.gridElement.type === GridElement.ELEMENT_TYPE_COLLECT) {
                        this.possibleTabs = { TAB_GENERAL, TAB_ACTIONS };
                    } else if (thiz.gridElement.type === GridElement.ELEMENT_TYPE_PREDICTION) {
                        this.possibleTabs = { TAB_ACTIONS };
                    } else if (thiz.gridElement.type === GridElement.ELEMENT_TYPE_LIVE) {
                        this.possibleTabs = { TAB_GENERAL, TAB_LIVE_DATA, TAB_IMAGE, TAB_ACTIONS };
                    } else if (thiz.gridElement.type === GridElement.ELEMENT_TYPE_MATRIX_CONVERSATION) {
                        this.possibleTabs = { TAB_GENERAL, TAB_ACTIONS };
                    }
                    thiz.originalGridElement = JSON.parse(JSON.stringify(thiz.gridElement));
                });
            },
            resetInternal() {
                this.gridElement = this.originalGridElement = null;
            },
            preventDefault(event) {
                event.preventDefault();
            },
            openHelp() {
                helpService.openHelp();
            },
            close() {
                this.$emit('close');
            }
        },
        mounted() {
            this.editElementId = this.editElementIdParam;
            this.initInternal();
            helpService.setHelpLocation('03_appearance_layout', '#edit-modal');
        },
        beforeDestroy() {
            helpService.revertToLastLocation();
        }
    }
</script>

<style scoped>
.ee-topo { display: flex; align-items: center; gap: var(--g-e3); min-width: 0; padding-top: var(--g-e3); }
.ee-abas { flex: 1; min-width: 0; }
.ee-so-uma { margin: 0; display: flex; align-items: center; gap: var(--g-e2); font-weight: 700; color: var(--g-tinta-2); }
.ee-so-uma .ti { font-size: 1.3em; color: var(--g-folha-escura); }
.ee-gira { animation: ee-girar 1s linear infinite; }
@keyframes ee-girar { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) { .ee-gira { animation: none; } }
@media (max-width: 600px) {
    .ee-extras { display: none; }
}
</style>
