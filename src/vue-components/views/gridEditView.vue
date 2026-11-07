<template>
    <div class="box g-tela edicao-tela">
        <header class="edicao-barra no-print" role="toolbar" :aria-label="$t('gestaoFerrBarra')" v-show="!propTransferObject">
            <div class="edicao-nome">
                <span class="g-pilula edicao-selo"><i class="ti ti-pencil" aria-hidden="true"></i>{{ isEditingGlobalGrid ? $t('gestaoFerrBarraFixa') : $t('gestaoFerrEditando') }}</span>
                <span class="edicao-nome-texto" v-if="gridData">{{ nomePrancha }}</span>
            </div>
            <div class="edicao-ferramentas">
                <button type="button" class="edicao-ferr edicao-ferr-destaque" @click="newElement(GridElement.ELEMENT_TYPE_NORMAL, false)" :aria-label="$t('gestaoFerrAdicionar')" :title="$t('gestaoFerrAdicionar')">
                    <i class="ti ti-square-plus" aria-hidden="true"></i><span>{{ $t('gestaoFerrAdicionar') }}</span>
                </button>
                <button type="button" class="edicao-ferr" @click="undo" :disabled="doingUndoRedo || !undoService.canUndo()" :aria-label="$t('gestaoFerrDesfazer')" :title="$t('gestaoFerrDesfazer')">
                    <i class="ti ti-arrow-back-up" aria-hidden="true"></i><span>{{ $t('gestaoFerrDesfazer') }}</span>
                </button>
                <button type="button" class="edicao-ferr" @click="redo" :disabled="doingUndoRedo || !undoService.canRedo()" :aria-label="$t('gestaoFerrRefazer')" :title="$t('gestaoFerrRefazer')">
                    <i class="ti ti-arrow-forward-up" aria-hidden="true"></i><span>{{ $t('gestaoFerrRefazer') }}</span>
                </button>
                <button type="button" class="edicao-ferr" @click="abrirCor" :aria-label="$t('gestaoFerrCor')" :title="$t('gestaoFerrCor')" aria-haspopup="dialog">
                    <i class="ti ti-palette" aria-hidden="true"></i><span>{{ $t('gestaoFerrCor') }}</span>
                </button>
                <button type="button" class="edicao-ferr" @click="showGridSettingsModal = true" :aria-label="$t('gestaoFerrLinhasColunas')" :title="$t('gestaoFerrLinhasColunas')" aria-haspopup="dialog">
                    <i class="ti ti-layout-grid" aria-hidden="true"></i><span>{{ $t('gestaoFerrLinhasColunas') }}</span>
                </button>
                <button type="button" class="edicao-ferr" @click="abrirMais" :aria-label="$t('gestaoFerrMais')" :title="$t('gestaoFerrMais')" aria-haspopup="dialog">
                    <i class="ti ti-dots" aria-hidden="true"></i><span>{{ $t('gestaoFerrMais') }}</span>
                </button>
                <button type="button" class="g-btn g-btn-principal edicao-concluir" @click="back" :aria-label="$t('gestaoFerrConcluir')">
                    <i class="ti ti-check" aria-hidden="true"></i><span>{{ $t('gestaoFerrConcluir') }}</span>
                </button>
            </div>
        </header>

        <div class="edicao-selecao no-print" v-if="markedElementIds.length > 0 && !propTransferObject" role="toolbar" :aria-label="$t('gestaoFerrEscolhidosBarra')">
            <span class="edicao-selecao-texto" aria-live="polite">{{ markedElementIds.length === 1 ? $t('gestaoFerrUmEscolhido') : $t('gestaoFerrVariosEscolhidos', [markedElementIds.length]) }}</span>
            <button type="button" class="g-btn edicao-sel-btn" v-if="markedElementIds.length === 1" @click="editElement()"><i class="ti ti-pencil" aria-hidden="true"></i><span>{{ $t('gestaoEditar') }}</span></button>
            <button type="button" class="g-btn edicao-sel-btn" @click="abrirCor"><i class="ti ti-palette" aria-hidden="true"></i><span>{{ $t('gestaoFerrCor') }}</span></button>
            <button type="button" class="g-btn edicao-sel-btn" @click="duplicateElements()"><i class="ti ti-copy" aria-hidden="true"></i><span>{{ $t('gestaoDuplicar') }}</span></button>
            <button type="button" class="g-btn edicao-sel-btn" @click="hideUnhideElements()"><i class="ti ti-eye-off" aria-hidden="true"></i><span>{{ $t('gestaoFerrEsconder') }}</span></button>
            <button type="button" class="g-btn g-btn-perigo edicao-sel-btn" @click="removeElements()"><i class="ti ti-trash" aria-hidden="true"></i><span>{{ $t('gestaoApagar') }}</span></button>
            <button type="button" class="g-btn g-btn-leve g-btn-icone" @click="unmarkAll()" :aria-label="$t('gestaoFerrDesmarcar')" :title="$t('gestaoFerrDesmarcar')"><i class="ti ti-x" aria-hidden="true"></i></button>
        </div>
        <p class="edicao-dica no-print" v-else-if="!propTransferObject && gridData">
            <i class="ti ti-hand-finger" aria-hidden="true"></i><span>{{ $t('gestaoFerrDica') }}</span>
        </p>

        <header class="edicao-transferir no-print" role="toolbar" v-if="propTransferObject">
            <i class="ti ti-brush" aria-hidden="true"></i>
            <span class="edicao-transferir-texto"><strong>{{ $t('gestaoFerrCopiarAparencia') }}</strong> {{ $t('gestaoFerrCopiarAparenciaDica') }}</span>
            <button type="button" class="g-btn" @click="stopPropTransfer"><i class="ti ti-x" aria-hidden="true"></i><span>{{ $t('gestaoCancelar') }}</span></button>
            <button type="button" class="g-btn g-btn-principal" @click="applyPropTransfer"><i class="ti ti-check" aria-hidden="true"></i><span>{{ $t('gestaoFerrAplicar') }}</span></button>
        </header>

        <edit-element v-if="showEditModal" v-bind:edit-element-id-param="editElementId" :undo-service="undoService" :grid-data-id="gridData.id" :new-position="newPosition" @reload="reload" @close="showEditModal = false" @mark="markElement" @actions="(id) => {editElementId = id; showActionsModal = true}"/>
        <add-multiple-modal v-if="showMultipleModal" v-bind:grid-data="gridData" :undo-service="undoService" @reload="reload" @close="showMultipleModal = false"/>
        <grid-settings-modal v-if="showGridSettingsModal" :grid-data-param="gridData" :is-global-grid="isEditingGlobalGrid" @reload="reload" @close="showGridSettingsModal = false;" :undo-service="undoService"/>
        <grid-translate-modal v-if="showTranslateModal" :grid-data-id="gridData.id" @close="showTranslateModal = false" @reload="reload"/>
        <set-navigation-modal v-if="showNavigateModal" :grid-id="gridData.id" :grid-element-id="editElementId" @close="showNavigateModal = false" @reload="reload"></set-navigation-modal>
        <transfer-props-modal v-if="showPropTransferModal" :grid-id="gridData.id" :grid-element-id="editElementId" @start="(propTransferObject) => startPropTransfer(propTransferObject)" @close="showPropTransferModal = false"></transfer-props-modal>

        <!-- painel "Cor" -->
        <div v-if="painel === 'cor'" class="edicao-camada" @keydown.esc="fecharPainel">
            <div class="g-veu" @click="fecharPainel"></div>
            <div class="g-painel g-tela edicao-painel" role="dialog" aria-modal="true" aria-labelledby="edicaoCorTitulo" ref="painel">
                <div class="g-painel-alca" aria-hidden="true"></div>
                <div class="edicao-painel-cabeca">
                    <h2 id="edicaoCorTitulo"><i class="ti ti-palette" aria-hidden="true"></i>{{ $t('gestaoFerrCor') }}</h2>
                    <button type="button" class="g-btn g-btn-leve g-btn-icone" @click="fecharPainel" :aria-label="$t('gestaoFechar')"><i class="ti ti-x" aria-hidden="true"></i></button>
                </div>
                <div class="gm-abas edicao-cor-alvo" role="tablist">
                    <button type="button" role="tab" class="gm-aba" :aria-selected="(corAlvo === 'botoes').toString()" @click="corAlvo = 'botoes'" :disabled="corBotoes.length === 0">
                        <i class="ti ti-square" aria-hidden="true"></i>{{ corBotoes.length === 1 ? $t('gestaoFerrCorBotaoEscolhido') : $t('gestaoFerrCorBotoesEscolhidos', [corBotoes.length]) }}
                    </button>
                    <button type="button" role="tab" class="gm-aba" :aria-selected="(corAlvo === 'fundo').toString()" @click="corAlvo = 'fundo'">
                        <i class="ti ti-background" aria-hidden="true"></i>{{ $t('gestaoFerrCorFundo') }}
                    </button>
                </div>
                <p class="g-dica" v-if="corBotoes.length === 0">{{ $t('gestaoFerrCorDicaEscolher') }}</p>
                <div class="edicao-cores" role="group" :aria-label="$t('gestaoFerrCorEscolha')">
                    <button v-for="cor in CORES" :key="cor.valor || 'nenhuma'" type="button" class="edicao-cor" @click="aplicarCor(cor.valor)" :aria-label="$t(cor.nome)" :title="$t(cor.nome)">
                        <span class="edicao-cor-amostra" :class="{'edicao-cor-nenhuma': !cor.valor}" :style="{background: cor.valor || undefined}" aria-hidden="true"><i v-if="!cor.valor" class="ti ti-ban"></i></span>
                        <span class="edicao-cor-nome">{{ $t(cor.nome) }}</span>
                    </button>
                </div>
                <div class="g-campo edicao-cor-livre">
                    <label for="edicaoCorLivre">{{ $t('gestaoFerrCorOutra') }}</label>
                    <input id="edicaoCorLivre" type="color" v-model="corLivre" @change="aplicarCor(corLivre)"/>
                </div>
            </div>
        </div>

        <!-- painel "Mais" -->
        <div v-if="painel === 'mais'" class="edicao-camada" @keydown.esc="fecharPainel">
            <div class="g-veu" @click="fecharPainel"></div>
            <div class="g-painel g-tela edicao-painel" role="dialog" aria-modal="true" aria-labelledby="edicaoMaisTitulo" ref="painel">
                <div class="g-painel-alca" aria-hidden="true"></div>
                <div class="edicao-painel-cabeca">
                    <h2 id="edicaoMaisTitulo">{{ $t('gestaoFerrMaisTitulo') }}</h2>
                    <button type="button" class="g-btn g-btn-leve g-btn-icone" @click="fecharPainel" :aria-label="$t('gestaoFechar')"><i class="ti ti-x" aria-hidden="true"></i></button>
                </div>
                <div v-for="grupo in gruposMais" :key="grupo.titulo" class="edicao-grupo">
                    <h3>{{ $t(grupo.titulo) }}</h3>
                    <div class="edicao-itens">
                        <button v-for="item in grupo.itens" :key="item.chave" type="button" class="edicao-item" :class="{'edicao-item-perigo': item.perigo}" :disabled="item.desligado" @click="executarMais(item.chave)">
                            <i :class="'ti ti-' + item.icone" aria-hidden="true"></i><span>{{ $t(item.nome) }}</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <div class="content" id="contentContainer" v-if="!(metadata && gridData)">
            <div v-if="!showGrid" class="grid-container grid-mask edicao-carregando" role="status">
                <i class="ti ti-loader-2" aria-hidden="true"></i><span class="g-oculto-leitor">{{ $t('gestaoCarregando') }}</span>
            </div>
        </div>
        <div class="content d-flex edicao-area" v-if="metadata && gridData" style="min-height: 0">
            <app-grid-display id="grid-container" @changed="handleChange" :grid-data="gridData" :metadata="metadata" :editable="true" @interacted="onInteracted" @interactstart="onInteractStart" @interactend="onInteractEnd"/>
        </div>
    </div>
</template>

<script>
    import $ from '../../js/externals/jquery.js';
    import {dataService} from "../../js/service/data/dataService";
    import {Router} from "./../../js/router.js";
    import {i18nService} from "../../js/service/i18nService";

    import EditElement from '../modals/editElement.vue'
    import AddMultipleModal from '../modals/addMultipleModal.vue'
    import {actionService} from "../../js/service/actionService";
    import {GridElement} from "../../js/model/GridElement";
    import {GridData} from "../../js/model/GridData";
    import {constants} from "../../js/util/constants";
    import HeaderIcon from '../../vue-components/components/headerIcon.vue'
    import {util} from "../../js/util/util";
    import GridSettingsModal from "../modals/gridSettingsModal.vue";
    import {gridUtil} from "../../js/util/gridUtil";
    import GridTranslateModal from "../modals/gridTranslateModal.vue";
    import SetNavigationModal from "../modals/setNavigationModal.vue";
    import {GridActionYoutube} from "../../js/model/GridActionYoutube";
    import {GridElementCollect} from "../../js/model/GridElementCollect.js";
    import {GridActionCollectElement} from "../../js/model/GridActionCollectElement.js";
    import {pouchDbService} from "../../js/service/data/pouchDbService.js";
    import {MainVue} from "../../js/vue/mainVue.js";
    import {stateService} from "../../js/service/stateService.js";
    import { UndoService } from '../../js/service/data/undoService';
    import { gridLayoutUtil } from '../grid-layout/utils/gridLayoutUtil';
    import { collectElementService } from '../../js/service/collectElementService';
    import AppGridDisplay from '../grid-display/appGridDisplay.vue';
    import { GridElementLive } from '../../js/model/GridElementLive';
    import { liveElementService } from '../../js/service/liveElementService';
    import TransferPropsModal from '../modals/transferPropsModal.vue';
    import { GridElementMatrixConversation } from '../../js/model/GridElementMatrixConversation';
    import {imageUtil} from "../../js/util/imageUtil";
    import {GridImage} from "../../js/model/GridImage";
    import {GridActionPredict} from "../../js/model/GridActionPredict";

    let vueApp = null;

    // cores prontas do painel "Cor" (tons claros, combinam com o texto escuro dos botões)
    const CORES = [
        {nome: 'gestaoCorAmarelo', valor: '#fff3c4'},
        {nome: 'gestaoCorVerde', valor: '#d9f7e8'},
        {nome: 'gestaoCorLaranja', valor: '#ffe1cf'},
        {nome: 'gestaoCorAzul', valor: '#dcefff'},
        {nome: 'gestaoCorLilas', valor: '#ece5ff'},
        {nome: 'gestaoCorVermelho', valor: '#ffd9d9'},
        {nome: 'gestaoCorRosa', valor: '#ffe0f0'},
        {nome: 'gestaoCorCinza', valor: '#ececec'},
        {nome: 'gestaoCorBranco', valor: '#ffffff'},
        {nome: 'gestaoCorSemCor', valor: null}
    ];

    let vueConfig = {
        props: ['gridId', 'highlightId'],
        data() {
            return {
                gridData: null,
                metadata: null,
                canUndo: false,
                canRedo: false,
                undoService: new UndoService(),
                doingUndoRedo: false,
                showMultipleModal: false,
                showGridSettingsModal: false,
                showNavigateModal: false,
                showTranslateModal: false,
                showPropTransferModal: false,
                showEditModal: false,
                editElementId: null,
                showGrid: false,
                constants: constants,
                markedElementIds: [],
                lastInteraction: {},
                newPosition: null,
                touchstartTimeoutHandler: null,
                isInteracting: false,
                unmarkTimeoutHandler: null,
                shiftKeyHold: false,
                ctrlKeyHold: false,
                usingTouchscreen: false,
                propTransferObject: null,
                painel: null,
                corAlvo: 'botoes',
                corBotoes: [],
                corLivre: '#ffffff',
                CORES: CORES,
                GridElement: GridElement
            }
        },
        components: {
            TransferPropsModal,
            AppGridDisplay,
            SetNavigationModal,
            GridTranslateModal,
            GridSettingsModal, EditElement, AddMultipleModal, HeaderIcon
        },
        computed: {
            nomePrancha() {
                return this.gridData ? i18nService.getTranslation(this.gridData.label) : '';
            },
            gruposMais() {
                let marcados = this.markedElementIds.length;
                let cheio = this.gridData ? new GridData({}, this.gridData).isFull() : false;
                let temEspacoReservado = this.gridData ? !!this.gridData.gridElements.find(e => e.type === GridElement.ELEMENT_TYPE_DYNAMIC_GRID_PLACEHOLDER) : false;
                let grupos = [];
                if (marcados > 0) {
                    let itens = [
                        {chave: 'CONTEXT_ACTION_COPY', nome: 'gestaoFerrCopiar', icone: 'copy'},
                        {chave: 'CONTEXT_ACTION_CUT', nome: 'gestaoFerrRecortar', icone: 'cut'}
                    ];
                    if (marcados === 1) {
                        itens.push({chave: 'CONTEXT_PROPERTY_TRANSFER_APPEARANCE', nome: 'gestaoFerrCopiarAparencia', icone: 'brush'});
                        itens.push({chave: 'CONTEXT_PROPERTY_TRANSFER', nome: 'gestaoFerrCopiarEscolhendo', icone: 'list-check'});
                        itens.push({chave: 'CONTEXT_GRID_NAVIGATION', nome: 'gestaoFerrQualPrancha', icone: 'arrow-right'});
                        itens.push({chave: 'CONTEXT_ACTION_DO_ACTION', nome: 'gestaoFerrTestar', icone: 'player-play'});
                    }
                    grupos.push({titulo: 'gestaoFerrGrupoEscolhidos', itens: itens});
                }
                let novos = [
                    {chave: 'CONTEXT_NEW_MASS', nome: 'gestaoFerrVarios', icone: 'layout-grid-add'},
                    {chave: 'CONTEXT_NEW_COLLECT', nome: 'gestaoFerrNovaBarraFrase', icone: 'message-2'},
                    {chave: 'CONTEXT_NEW_PREDICT', nome: 'gestaoFerrNovaSugestao', icone: 'bulb'},
                    {chave: 'CONTEXT_NEW_YT_PLAYER', nome: 'gestaoFerrNovoVideo', icone: 'brand-youtube'},
                    {chave: 'CONTEXT_NEW_LIVE', nome: 'gestaoFerrNovoAoVivo', icone: 'activity'},
                    {chave: 'CONTEXT_NEW_MATRIX_CONVERSATION', nome: 'gestaoFerrNovaConversa', icone: 'messages'}
                ];
                if (this.isEditingGlobalGrid) {
                    novos.push({chave: 'CONTEXT_NEW_CHILD_PLACEHOLDER', nome: 'gestaoFerrNovoEspacoPrancha', icone: 'layout-board', desligado: temEspacoReservado});
                }
                grupos.push({titulo: 'gestaoFerrGrupoNovos', itens: novos});
                grupos.push({titulo: 'gestaoFerrGrupoCopiar', itens: [
                    {chave: 'CONTEXT_COPY_ALL', nome: 'gestaoFerrCopiarTodos', icone: 'copy'},
                    {chave: 'CONTEXT_ACTION_PASTE', nome: 'gestaoFerrColar', icone: 'clipboard'}
                ]});
                grupos.push({titulo: 'gestaoFerrGrupoArrumar', itens: [
                    {chave: 'CONTEXT_LAYOUT_ALL_UP', nome: 'gestaoFerrMoverCima', icone: 'arrow-bar-up'},
                    {chave: 'CONTEXT_LAYOUT_ALL_DOWN', nome: 'gestaoFerrMoverBaixo', icone: 'arrow-bar-down'},
                    {chave: 'CONTEXT_LAYOUT_ALL_LEFT', nome: 'gestaoFerrMoverEsquerda', icone: 'arrow-bar-left'},
                    {chave: 'CONTEXT_LAYOUT_ALL_RIGHT', nome: 'gestaoFerrMoverDireita', icone: 'arrow-bar-right'},
                    {chave: 'CONTEXT_FILL_EMPTY', nome: 'gestaoFerrPreencher', icone: 'square-plus-2', desligado: cheio},
                    {chave: 'CONTEXT_LAYOUT_NORMALIZE', nome: 'gestaoFerrArrumarEspacos', icone: 'layout-distribute-horizontal'},
                    {chave: 'CONTEXT_DELETE_ALL', nome: 'gestaoFerrApagarTodos', icone: 'trash', perigo: true}
                ]});
                grupos.push({titulo: 'gestaoFerrGrupoPrancha', itens: [
                    {chave: 'CONTEXT_SEARCH', nome: 'gestaoFerrProcurar', icone: 'search'},
                    {chave: 'CONTEXT_GRID_TRANSLATION', nome: 'gestaoFerrTraduzir', icone: 'language'},
                    this.isEditingGlobalGrid ? {chave: 'CONTEXT_END_EDIT_GLOBAL_GRID', nome: 'gestaoFerrSairBarraFixa', icone: 'layout-navbar'}
                        : {chave: 'CONTEXT_EDIT_GLOBAL_GRID', nome: 'gestaoFerrEditarBarraFixa', icone: 'layout-navbar'}
                ]});
                return grupos;
            },
            isEditingGlobalGrid() {
                if (!this.metadata || !this.gridData || !this.metadata.globalGridId) {
                    return false;
                }
                return this.metadata.globalGridId === this.gridData.id;
            }
        },
        methods: {
            abrirPainel(nome) {
                this.painel = nome;
                this.$nextTick(() => {
                    let alvo = this.$refs.painel ? this.$refs.painel.querySelector('.edicao-cor, .edicao-item:not([disabled])') : null;
                    if (alvo) alvo.focus();
                });
            },
            abrirCor() {
                this.corBotoes = this.markedElementIds.slice();
                this.corAlvo = this.corBotoes.length > 0 ? 'botoes' : 'fundo';
                this.abrirPainel('cor');
            },
            abrirMais() {
                this.abrirPainel('mais');
            },
            fecharPainel() {
                this.painel = null;
            },
            async aplicarCor(valor) {
                if (this.corAlvo === 'botoes' && this.corBotoes.length > 0) {
                    for (let element of this.getElements(this.corBotoes)) {
                        element.backgroundColor = valor || null;
                    }
                } else {
                    this.gridData.backgroundColor = valor || null;
                }
                this.painel = null;
                await this.updateGridWithUndo();
                this.unmarkAll(); // the reload redraws the buttons, so the marks would be lost anyway
                await this.reload(); // the grid layout keeps its own element copies; reload so the new color shows
            },
            executarMais(chave) {
                this.painel = null;
                if (this.acaoMenu) {
                    this.acaoMenu(chave);
                }
            },
            configPropTransfer(id) {
                if (!id && this.markedElementIds.length !== 1) {
                    return;
                }
                this.editElementId = id || this.markedElementIds[0];
                this.showPropTransferModal = true;
            },
            configPropTransferAll(id) {
                if (!id && this.markedElementIds.length !== 1) {
                    return;
                }
                this.editElementId = id || this.markedElementIds[0];
                let propTransferObject = gridUtil.getPropTransferObjectAll(this.getElement(this.editElementId));
                this.startPropTransfer(propTransferObject);
            },
            configPropTransferAppearance(id) {
                if (!id && this.markedElementIds.length !== 1) {
                    return;
                }
                this.editElementId = id || this.markedElementIds[0];
                let propTransferObject = gridUtil.getPropTransferObjectAppearance(this.getElement(this.editElementId));
                this.startPropTransfer(propTransferObject);
            },
            startPropTransfer(propTransferObject) {
                this.unmarkAll();
                $('.element-container').removeClass('transfer-prop-source');
                $('#' + this.editElementId).addClass('transfer-prop-source');
                this.propTransferObject = propTransferObject;
                this.$nextTick(() => {
                    $.contextMenu('destroy'); // if executed in same context, re-adding context menu after prop transfer does not work anymore for the transfer source element
                })
            },
            async applyPropTransfer() {
                let actionElements = this.getElementsForAction();
                for (let element of actionElements) {
                    for (let path of gridUtil.getAllPropTransferPaths()) {
                        if (this.propTransferObject[path] !== constants.PROP_TRANSFER_DONT_CHANGE) {
                            this.$set(element, path, this.propTransferObject[path]);
                        }
                    }
                }
                await this.updateGridWithUndo();
                this.stopPropTransfer();
            },
            stopPropTransfer() {
                this.propTransferObject = null;
                $('#' + this.editElementId).removeClass('transfer-prop-source');
                this.unmarkAll();
                initContextmenu();
            },
            moveAll: function(dir) {
                this.gridData.gridElements = gridLayoutUtil.moveAsPossible(this.gridData.gridElements, this.gridData.gridElements, dir, {
                    outOfBounds: false,
                    gridWidth: gridUtil.getWidthWithBounds(this.gridData),
                    gridHeight: gridUtil.getHeightWithBounds(this.gridData)
                });
                this.updateGridWithUndo();
            },
            normalizeGrid: function () {
                gridUtil.ensureUniqueIds(this.gridData.gridElements);
                this.gridData.gridElements = gridLayoutUtil.normalizeGrid(this.gridData.gridElements);
                this.updateGridWithUndo();
            },
            async handleChange(newElements) {
                this.gridData.gridElements = newElements;
                await this.updateGridWithUndo();
            },
            undo: async function () {
                if (!this.undoService.canUndo()) {
                    return;
                }
                this.doingUndoRedo = true;
                this.gridData = await this.undoService.doUndo();
                this.doingUndoRedo = false;
                this.$forceUpdate();
            },
            redo: async function () {
                if (!this.undoService.canRedo()) {
                    return;
                }
                this.doingUndoRedo = true;
                this.gridData = await this.undoService.doRedo();
                this.doingUndoRedo = false;
                this.$forceUpdate();
            },
            async updateGridWithUndo() {
                await this.undoService.updateGrid(this.gridData);
                this.$forceUpdate();
            },
            async reload(gridData) {
                gridData = gridData || (await dataService.getGrid(this.gridData.id));
                this.gridData = gridData;
                liveElementService.updateOnce({ elements: this.gridData.gridElements, forceUpdate: true });
            },
            back() {
                if (this.isEditingGlobalGrid) {
                    Router.toMain();
                } else {
                    Router.toGrid(this.gridData.id);
                }
            },
            toEditGlobal() {
                let globalId = this.gridData.globalGridId || this.metadata.globalGridId;
                if (globalId) {
                    Router.toEditGrid(globalId);
                }
            },
            toEditChild() {
                if (this.isEditingGlobalGrid) {
                    Router.toEditGrid(this.metadata.lastOpenedGridId);
                }
            },
            editElement(elementId = null) {
                if (!elementId && this.markedElementIds.length !== 1) {
                    return;
                }
                this.editElementId = elementId || this.markedElementIds[0];
                let editElement = this.gridData.gridElements.filter(e => e.id === this.editElementId)[0];
                if (editElement) {
                    this.showEditModal = true;
                }
                this.unmarkAll();
            },
            removeElements(shouldIncludeId = null) {
                let removeIds = this.getElementIdsForAction(shouldIncludeId);
                if (!removeIds.length) {
                    return;
                }
                this.gridData.gridElements = this.gridData.gridElements.filter((el) => !removeIds.includes(el.id));
                this.updateGridWithUndo();
                this.unmarkAll();
            },
            copyElements(shouldIncludeId = null) {
                let elements = this.getElementsForAction(shouldIncludeId);
                util.gridElementsToClipboard(elements);
                this.unmarkAll();
            },
            copyAllElements() {
                util.gridElementsToClipboard(this.gridData.gridElements);
            },
            cutElements(shouldIncludeId = null) {
                let elements = this.getElementsForAction(shouldIncludeId);
                if (!elements.length) {
                    return;
                }
                util.gridElementsToClipboard(elements);
                this.removeElements(shouldIncludeId);
                this.unmarkAll();
            },
            async duplicateElements(shouldIncludeId = null) {
                let elements = this.getElementsForAction(shouldIncludeId);
                if (!elements.length) {
                    return;
                }
                let duplicates = gridUtil.duplicateElements(elements);
                this.unmarkAll();
                if (duplicates.length === 1) {
                    this.gridData.gridElements = gridLayoutUtil.insertDuplicate(this.gridData.gridElements, elements[0], duplicates[0], {
                        gridWidth: this.gridData.minColumnCount,
                        gridHeight: this.gridData.rowCount
                    });
                    return this.updateGridWithUndo();
                } else {
                    return this.pasteElements(duplicates);
                }
            },
            hideUnhideElements(shouldIncludeId = null) {
                let elements = this.getElementsForAction(shouldIncludeId);
                if (!elements.length) {
                    return;
                }
                let allHidden = elements.every(e => e.hidden);
                for (let element of elements) {
                    element.hidden = !allHidden;
                }
                this.updateGridWithUndo();
                this.unmarkAll();
            },
            async newElement(type, useInteractionPos) {
                let interactionPosToUse = useInteractionPos && this.lastInteraction && this.lastInteraction.x !== undefined ? this.lastInteraction : null;
                if (type === GridElement.ELEMENT_TYPE_NORMAL) {
                    this.editElementId = null;
                    this.newPosition = interactionPosToUse;
                    this.showEditModal = true;
                } else {
                    let showEdit = false;
                    let newPos = new GridData(this.gridData).getNewXYPos();
                    let baseProperties = {
                        type: type,
                        x: interactionPosToUse ? interactionPosToUse.x : newPos.x,
                        y: interactionPosToUse ? interactionPosToUse.y : newPos.y
                    };
                    let newElement = new GridElement(baseProperties);
                    if (type === GridElement.ELEMENT_TYPE_YT_PLAYER) {
                        let playPause = new GridActionYoutube({
                            action: GridActionYoutube.actions.YT_TOGGLE
                        });
                        newElement.actions = [playPause];
                    } else if (type === GridElement.ELEMENT_TYPE_COLLECT) {
                        newElement = new GridElementCollect(baseProperties);
                        let playAction = new GridActionCollectElement({
                            action: GridActionCollectElement.COLLECT_ACTION_SPEAK
                        });
                        let predictAction = new GridActionPredict({
                            suggestOnChange: true
                        });
                        newElement.actions = [playAction, predictAction];
                    } else if (type === GridElement.ELEMENT_TYPE_LIVE) {
                        newElement = new GridElementLive(baseProperties);
                        showEdit = true;
                    } else if (type === GridElement.ELEMENT_TYPE_MATRIX_CONVERSATION) {
                        newElement = new GridElementMatrixConversation(baseProperties);
                    } else if (type === GridElement.ELEMENT_TYPE_DYNAMIC_GRID_PLACEHOLDER) {
                        newElement = gridLayoutUtil.increaseElement(this.gridData.gridElements, newElement, {
                            gridWidth: this.gridData.minColumnCount,
                            gridHeight: this.gridData.rowCount
                        });
                    }
                    newElement = JSON.parse(JSON.stringify(newElement));
                    this.gridData.gridElements.push(newElement);
                    await this.updateGridWithUndo();
                    if (showEdit) {
                        this.editElementId = newElement.id;
                        this.showEditModal = true;
                    }
                }
            },
            newElements() {
                this.showMultipleModal = true;
            },
            clearElements() {
                if (confirm(i18nService.t('CONFIRM_DELETE_ALL_ELEMS'))) {
                    this.gridData.gridElements = [];
                    this.updateGridWithUndo();
                }
            },
            fillElements() {
                let elements = gridUtil.getFillElements(this.gridData);
                this.gridData.gridElements = this.gridData.gridElements.concat(elements);
                this.updateGridWithUndo();
            },
            reloadFn(event, updatedIds, updatedDocs, deletedIds) {
                if (vueApp && deletedIds.includes(vueApp.gridId)) {
                    Router.toManageGrids();
                    return;
                }
                if (vueApp && updatedIds.includes(vueApp.gridData.id)) {
                    let gridData = new GridData(updatedDocs.filter(doc => doc.id === vueApp.gridData.id)[0]);
                    if (!gridData.isEqual(vueApp.gridData)) {
                        log.debug('reloading on remote update...');
                        vueApp.reload(gridData);
                    }
                } else if (updatedIds.includes(vueApp.metadata.id)) {
                    let metadata = updatedDocs.filter(doc => doc.id === vueApp.metadata.id)[0];
                    if (metadata && JSON.stringify(metadata.colorConfig) !== JSON.stringify(vueApp.metadata.colorConfig)) {
                        vueApp.reload();
                    }
                }
            },
            unmarkAll() {
                $('.element-container').removeClass('marked');
                this.markedElementIds = [];
            },
            markAll() {
                $('.element-container').addClass('marked');
                this.markedElementIds = this.gridData.gridElements.map(e => e.id);
            },
            async markElement(id) {
                if (!id) {
                    return;
                }
                await this.$nextTick();
                util.throttle(() => {
                    if (this.shiftKeyHold && this.markedElementIds.length) {
                        let allElems = this.gridData.gridElements;
                        let clickedElem = allElems.find(e => e.id === id);
                        let markedElems = this.markedElementIds.map(elId => allElems.find(e => e.id === elId));
                        let firstMarked = markedElems[0];
                        let addElems = allElems.filter(e => gridUtil.isWithinElements(clickedElem, firstMarked, e));
                        this.unmarkAll();
                        this.addToMarkedInternal(firstMarked.id); // keep firstMarked first for consistent behaviour
                        for (let addElem of addElems) {
                            this.addToMarkedInternal(addElem.id);
                        }
                        return;
                    }
                    if (this.markedElementIds.length === 1 && this.markedElementIds.includes(id)) {
                        // unselect single marked element on second click
                        this.unmarkAll();
                        return;
                    }
                    if (!this.usingTouchscreen && !this.ctrlKeyHold) {
                        // no multi-select mode on desktop without Ctrl
                        this.unmarkAll();
                    }
                    if (!this.markedElementIds.includes(id)) {
                        this.addToMarkedInternal(id);
                    } else {
                        this.markedElementIds = this.markedElementIds.filter(elId => elId !== id);
                        $('#' + id).removeClass('marked');
                    }
                }, null, 200, "MARK_ELEMENT");
            },
            addToMarkedInternal(id) {
                if (id && !this.markedElementIds.includes(id)) {
                    this.markedElementIds.push(id);
                    $('#' + id).addClass('marked');
                }
            },
            highlightElement() {
                if (this.highlightId) {
                    $(`#${this.highlightId}`).addClass('highlight');
                    setTimeout(() => {
                        $(`#${this.highlightId}`).removeClass('highlight');
                    }, 4000);
                }
            },
            async pasteElements(elements = null) {
                this.unmarkAll();
                elements = elements || (await util.getGridElementsFromClipboard()) || [];
                if (!elements.length) {
                    // see if there is some image in the clipboard and add element containing the image
                    let base64 = await util.getClipboardImageAsBase64();
                    try {
                        let compressed = await imageUtil.compressToSize(base64, 300);
                        if (compressed) {
                            let element = new GridElement({image: new GridImage({data: compressed})});
                            elements.push(JSON.parse(JSON.stringify(element)));
                        }
                    } catch (e) {
                    }
                }
                if (!elements || !elements.length) {
                   return;
                }
                if (elements.length === 1) {
                    let element = elements[0];
                    element.width = 1;
                    element.height = 1;
                    element.x = this.lastInteraction.x !== undefined ? this.lastInteraction.x : gridUtil.getHeightWithBounds(this.gridData);
                    element.y = this.lastInteraction.y !== undefined ? this.lastInteraction.y : 0;
                    this.gridData.gridElements.push(element);
                    this.gridData.gridElements = gridLayoutUtil.resolveCollisions(this.gridData.gridElements, element);
                } else if (gridLayoutUtil.elementsCanBeInsertedAt(this.gridData, elements, this.lastInteraction)) {
                    let normalized = gridLayoutUtil.normalizePositions(elements);
                    for (let element of normalized) {
                        element.x += this.lastInteraction.x;
                        element.y += this.lastInteraction.y;
                    }
                    this.gridData.gridElements = this.gridData.gridElements.concat(normalized);
                } else {
                    let firstEmptyRow = gridUtil.getHeight(this.gridData);
                    let minY = Math.min(...elements.map(e => e.y));
                    elements = elements.map(el => {
                        el.y += firstEmptyRow - minY;
                        return el;
                    });
                    this.gridData.gridElements = this.gridData.gridElements.concat(elements);
                }
                this.updateGridWithUndo();
            },
            getElements(ids = []) {
                return this.gridData.gridElements.filter(el => ids.includes(el.id));
            },
            getElement(id) {
                return this.gridData.gridElements.find(el => el.id === id);
            },
            getElementIdsForAction(shouldIncludeId = null) {
                let ids = this.markedElementIds;
                if (shouldIncludeId && !this.markedElementIds.includes(shouldIncludeId)) {
                    this.unmarkAll();
                    ids = [shouldIncludeId];
                }
                return ids;
            },
            getElementsForAction(shouldIncludeId = null) {
                return this.getElements(this.getElementIdsForAction(shouldIncludeId));
            },
            onInteracted(x, y) {
                this.lastInteraction.x = x;
                this.lastInteraction.y = y;
            },
            onClick(event) {
                if (vueApp && !this.isInteracting) {
                    let elementId = $(event.target).closest('.element-container').attr('id');
                    let containerElement = $(event.target).closest('#grid-container')[0];
                    if (elementId) {
                        vueApp.markElement(elementId);
                    } else {
                        this.unmarkAll();
                        if (containerElement && this.usingTouchscreen) {
                            const newEvent = new MouseEvent("contextmenu", {
                                bubbles: true,
                                cancelable: true,
                                clientX: event.clientX,
                                clientY: event.clientY,
                                pageX: event.pageX,
                                pageY: event.pageY,
                                screenX: event.screenX,
                                screenY: event.screenY,
                                button: 2
                            });
                            containerElement.dispatchEvent(newEvent);
                        }
                    }
                }
            },
            onTouchstart(event) {
                this.usingTouchscreen = true;
                if (!constants.IS_SAFARI) {
                    return;
                }
                this.touchstartTimeoutHandler = setTimeout(() => {
                    const newEvent = new MouseEvent("contextmenu", {
                        bubbles: true,
                        cancelable: true,
                        clientX: event.touches[0].clientX,
                        clientY: event.touches[0].clientY,
                        pageX: event.touches[0].pageX,
                        pageY: event.touches[0].pageY,
                        screenX: event.touches[0].screenX,
                        screenY: event.touches[0].screenY
                    });
                    let closestElement = $(event.target).closest('.element-container')[0];
                    let containerElement = $(event.target).closest('#grid-container')[0];
                    let dispatchElement = closestElement || containerElement;
                    if (dispatchElement) {
                        dispatchElement.dispatchEvent(newEvent);
                    }
                }, 600)
            },
            onTouchEnd() {
                clearTimeout(this.touchstartTimeoutHandler);
            },
            onInteractStart() {
                this.isInteracting = true;
                this.unmarkTimeoutHandler = setTimeout(() => {
                    this.unmarkAll();
                }, 100);
            },
            onInteractEnd() {
                setTimeout(() => {
                    this.isInteracting = false; // reset after click event is fired
                }, 100);
                clearTimeout(this.unmarkTimeoutHandler);
            },
            onContextMenu(event) {
                if (this.propTransferObject) {
                    event.preventDefault();
                    return;
                }
                let clickedId = $(event.target).closest('.element-container').attr('id');
                if (!clickedId || !this.markedElementIds.includes(clickedId)) {
                    this.unmarkAll();
                }
                this.addToMarkedInternal(clickedId);
            },
            onKeyUp() {
                this.shiftKeyHold = false;
                this.ctrlKeyHold = false;
            },
            onKeyDown(event) {
                if (this.showMultipleModal || this.showGridSettingsModal || this.showNavigateModal || this.showTranslateModal || this.showPropTransferModal || this.showEditModal) {
                    return;
                }
                const ctrlOrMeta = constants.IS_MAC ? event.metaKey : event.ctrlKey;
                this.ctrlKeyHold = ctrlOrMeta;
                const isUndoRedo = event.key.toLocaleUpperCase() === 'Z' || event.code === 'KeyZ';
                if (!event.repeat) {
                    if (event.code === 'Delete') {
                        event.preventDefault();
                        this.removeElements();
                    }
                    if (event.key === 'Enter') {
                        if (this.propTransferObject) {
                            this.applyPropTransfer();
                        }
                    }
                    if (event.code === 'Escape') {
                        this.unmarkAll();
                        if (this.propTransferObject) {
                            this.stopPropTransfer();
                        }
                    }
                    if (event.shiftKey) {
                        this.shiftKeyHold = true;
                    }
                    if (ctrlOrMeta) {
                        if (event.shiftKey && event.code === 'KeyA') {
                            event.preventDefault();
                            this.configPropTransferAll();
                            return;
                        }
                        if (event.shiftKey && event.code === 'KeyC') {
                            event.preventDefault();
                            this.configPropTransferAppearance();
                            return;
                        }
                        if (event.shiftKey && event.code === 'KeyP') {
                            event.preventDefault();
                            this.configPropTransfer();
                            return;
                        }
                        if (event.shiftKey && event.code === 'KeyI') {
                            event.preventDefault();
                            this.newElements();
                            return;
                        }
                        if (event.shiftKey && event.code === 'KeyG') {
                            event.preventDefault();
                            if (this.isEditingGlobalGrid) {
                                this.toEditChild();
                            } else {
                                this.toEditGlobal();
                            }
                            return;
                        }
                        if (event.code === 'KeyI') {
                            event.preventDefault();
                            this.newElement(GridElement.ELEMENT_TYPE_NORMAL);
                            return;
                        }
                        if (event.code === 'KeyA') {
                            event.preventDefault();
                            this.markAll();
                        }
                        if (event.code === 'KeyD') {
                            event.preventDefault();
                            this.duplicateElements();
                        }
                        if (event.code === 'KeyE') {
                            event.preventDefault();
                            this.editElement();
                        }
                        if (event.code === 'KeyC') {
                            event.preventDefault();
                            this.copyElements();
                        }
                        if (event.code === 'KeyX') {
                            event.preventDefault();
                            this.cutElements();
                        }
                        if (event.code === 'KeyV') {
                            event.preventDefault();
                            this.pasteElements();
                        }
                        if (event.code === 'KeyH') {
                            event.preventDefault();
                            this.hideUnhideElements();
                        }
                        if (isUndoRedo && !event.shiftKey) {
                            event.preventDefault();
                            this.undo();
                        }
                        if (isUndoRedo && event.shiftKey) {
                            event.preventDefault();
                            this.redo();
                        }
                        if (event.code === 'ArrowUp') {
                            event.preventDefault();
                            this.moveAll(gridLayoutUtil.DIR_UP);
                        }
                        if (event.code === 'ArrowRight') {
                            event.preventDefault();
                            this.moveAll(gridLayoutUtil.DIR_RIGHT);
                        }
                        if (event.code === 'ArrowDown') {
                            event.preventDefault();
                            this.moveAll(gridLayoutUtil.DIR_DOWN);
                        }
                        if (event.code === 'ArrowLeft') {
                            event.preventDefault();
                            this.moveAll(gridLayoutUtil.DIR_LEFT);
                        }
                    }
                }
            }
        },
        created() {
            $(document).on(constants.EVENT_DB_PULL_UPDATED, this.reloadFn);
            document.addEventListener("keydown", this.onKeyDown);
            document.addEventListener("keyup", this.onKeyUp);
        },
        mounted: async function () {
            pouchDbService.pauseSync();
            let thiz = this;
            vueApp = thiz;

            let gridData = await dataService.getGrid(this.gridId);
            if (!gridData) {
                log.warn('grid not found! gridId: ' + this.gridId);
                Router.toMain();
                return Router.toMain();
            }
            thiz.gridData = JSON.parse(JSON.stringify(gridData));
            stateService.setCurrentGrid(thiz.gridData);

            let savedMetadata = await dataService.getMetadata();
            thiz.metadata = JSON.parse(JSON.stringify(savedMetadata));
            if (!thiz.isEditingGlobalGrid) {
                thiz.metadata.lastOpenedGridId = thiz.gridData.id;
                await dataService.saveMetadata(thiz.metadata);
            }

            thiz.showGrid = true;
            thiz.highlightElement();
            this.$nextTick(() => {
                let container = document.getElementById('grid-container');
                container.addEventListener('click', this.onClick);
                container.addEventListener('touchstart', this.onTouchstart);
                container.addEventListener('touchmove', this.onTouchEnd);
                container.addEventListener('touchcancel', this.onTouchEnd);
                container.addEventListener('touchend', this.onTouchEnd);
                container.addEventListener("contextmenu", this.onContextMenu);
                collectElementService.initWithGrid(this.gridData);
                liveElementService.updateOnce({ elements: this.gridData.gridElements });
                initContextmenu();
            });
        },
        beforeDestroy() {
            pouchDbService.resumeSync();
            $(document).off(constants.EVENT_DB_PULL_UPDATED, this.reloadFn);
            document.removeEventListener("keydown", this.onKeyDown);
            document.removeEventListener("keyup", this.onKeyUp);
            let container = document.getElementById('grid-container');
            if (container) {
                container.removeEventListener('click', this.onClick);
                container.removeEventListener('touchstart', this.onTouchstart);
                container.removeEventListener('touchmove', this.onTouchEnd);
                container.removeEventListener('touchcancel', this.onTouchEnd);
                container.removeEventListener('touchend', this.onTouchEnd);
                container.removeEventListener("contextmenu", this.onContextMenu);
            }
            vueApp = null;
            $.contextMenu('destroy');
        }
    };

    function initContextmenu() {
        //see https://swisnl.github.io/jQuery-contextMenu/demo.html

        var CONTEXT_FILL_EMPTY = "CONTEXT_FILL_EMPTY";
        var CONTEXT_COPY_ALL = "CONTEXT_COPY_ALL";
        var CONTEXT_DELETE_ALL = "CONTEXT_DELETE_ALL";

        let CONTEXT_ACTION_EDIT = 'CONTEXT_ACTION_EDIT';
        let CONTEXT_ACTION_DELETE = 'CONTEXT_ACTION_DELETE';
        let CONTEXT_ACTION_DUPLICATE = 'CONTEXT_ACTION_DUPLICATE';
        let CONTEXT_ACTION_COPY = 'CONTEXT_ACTION_COPY';
        let CONTEXT_ACTION_CUT = 'CONTEXT_ACTION_CUT';
        let CONTEXT_ACTION_PASTE = 'CONTEXT_ACTION_PASTE';
        let CONTEXT_ACTION_DO_ACTION = 'CONTEXT_ACTION_DO_ACTION';

        var CONTEXT_NEW_GROUP = "CONTEXT_NEW_GROUP";
        var CONTEXT_NEW_GROUP_REDUCED = "CONTEXT_NEW_GROUP_REDUCED";
        var CONTEXT_NEW_SINGLE = "CONTEXT_NEW_SINGLE";
        var CONTEXT_NEW_MASS = "CONTEXT_NEW_MASS";
        var CONTEXT_NEW_COLLECT = "CONTEXT_NEW_COLLECT";
        var CONTEXT_NEW_PREDICT = "CONTEXT_NEW_PREDICT";
        var CONTEXT_NEW_YT_PLAYER = "CONTEXT_NEW_YT_PLAYER";
        var CONTEXT_NEW_LIVE = "CONTEXT_NEW_LIVE";
        var CONTEXT_NEW_MATRIX_CONVERSATION = "CONTEXT_NEW_MATRIX_CONVERSATION";
        var CONTEXT_NEW_CHILD_PLACEHOLDER = "CONTEXT_NEW_CHILD_PLACEHOLDER";

        var CONTEXT_LAYOUT_ALL_UP = "CONTEXT_LAYOUT_ALL_UP";
        var CONTEXT_LAYOUT_ALL_RIGHT = "CONTEXT_LAYOUT_ALL_RIGHT";
        var CONTEXT_LAYOUT_ALL_DOWN = "CONTEXT_LAYOUT_ALL_DOWN";
        var CONTEXT_LAYOUT_ALL_LEFT = "CONTEXT_LAYOUT_ALL_LEFT";
        var CONTEXT_LAYOUT_NORMALIZE = "CONTEXT_LAYOUT_NORMALIZE";
        var CONTEXT_GRID_SETTINGS = "CONTEXT_GRID_SETTINGS";
        var CONTEXT_GRID_NAVIGATION = "CONTEXT_GRID_NAVIGATION";
        var CONTEXT_GRID_TRANSLATION = "CONTEXT_GRID_TRANSLATION";
        var CONTEXT_EDIT_GLOBAL_GRID = "CONTEXT_EDIT_GLOBAL_GRID";
        var CONTEXT_END_EDIT_GLOBAL_GRID = "CONTEXT_END_EDIT_GLOBAL_GRID";
        var CONTEXT_SEARCH = "CONTEXT_SEARCH";

        let CONTEXT_QUICK_HIDE = "CONTEXT_QUICK_HIDE";
        let CONTEXT_PROPERTY_TRANSFER = "CONTEXT_PROPERTY_TRANSFER";
        let CONTEXT_PROPERTY_TRANSFER_APPEARANCE = "CONTEXT_PROPERTY_TRANSFER_APPEARANCE";
        let CONTEXT_PROPERTY_TRANSFER_ALL = "CONTEXT_PROPERTY_TRANSFER_ALL";

        let childPlaceholderDisabledFn = () => !!vueApp.gridData.gridElements.find(e => e.type === GridElement.ELEMENT_TYPE_DYNAMIC_GRID_PLACEHOLDER);
        let contextMenuNewGroup = {
            name: i18nService.t('gestaoFerrGrupoNovos'), icon: "ti ti-circle-plus", items: {
                'CONTEXT_NEW_SINGLE': {name: i18nService.t('gestaoFerrAdicionar'), icon: "ti ti-square-plus"},
                'CONTEXT_NEW_MASS': {name: i18nService.t('gestaoFerrVarios'), icon: "ti ti-layout-grid-add"},
                'CONTEXT_NEW_CHILD_PLACEHOLDER': {
                    name: i18nService.t('gestaoFerrNovoEspacoPrancha'),
                    icon: "ti ti-layout-board",
                    visible: vueApp.isEditingGlobalGrid,
                    disabled: childPlaceholderDisabledFn
                },
                'CONTEXT_NEW_COLLECT': {
                    name: i18nService.t('gestaoFerrNovaBarraFrase'),
                    icon: "ti ti-message-2"
                },
                'CONTEXT_NEW_PREDICT': {
                    name: i18nService.t('gestaoFerrNovaSugestao'),
                    icon: "ti ti-bulb"
                },
                'CONTEXT_NEW_YT_PLAYER': {
                    name: i18nService.t('gestaoFerrNovoVideo'),
                    icon: "ti ti-brand-youtube"
                },
                'CONTEXT_NEW_LIVE': {
                    name: i18nService.t('gestaoFerrNovoAoVivo'),
                    icon: "ti ti-activity"
                },
                'CONTEXT_NEW_MATRIX_CONVERSATION': {
                    name: i18nService.t('gestaoFerrNovaConversa'),
                    icon: "ti ti-messages"
                }
            }
        };

        var itemsGlobal = {
            'CONTEXT_NEW_SINGLE': {name: i18nService.t('gestaoFerrAdicionar'), icon: "ti ti-square-plus"},
            'CONTEXT_NEW_MASS': {name: i18nService.t('gestaoFerrVarios'), icon: "ti ti-layout-grid-add"},
            CONTEXT_ACTION_PASTE: {name: i18nService.t('gestaoFerrColar'), icon: "ti ti-clipboard"},
            CONTEXT_NEW_GROUP_REDUCED: JSON.parse(JSON.stringify(contextMenuNewGroup))
        };
        itemsGlobal[CONTEXT_NEW_GROUP_REDUCED].items[CONTEXT_NEW_SINGLE].visible = false;
        itemsGlobal[CONTEXT_NEW_GROUP_REDUCED].items[CONTEXT_NEW_MASS].visible = false;
        itemsGlobal[CONTEXT_NEW_GROUP_REDUCED].items[CONTEXT_NEW_CHILD_PLACEHOLDER].disabled = childPlaceholderDisabledFn;
        itemsGlobal[CONTEXT_NEW_GROUP_REDUCED].name = i18nService.t('gestaoFerrGrupoNovos');

        let itemsTransferProps = {
            'CONTEXT_PROPERTY_TRANSFER_ALL': { name: i18nService.t('gestaoFerrCopiarTudo'), icon: "ti ti-brush" },
            'CONTEXT_PROPERTY_TRANSFER_APPEARANCE': { name: i18nService.t('gestaoFerrCopiarAparencia'), icon: "ti ti-brush" },
            'CONTEXT_PROPERTY_TRANSFER': { name: i18nService.t('gestaoFerrCopiarEscolhendo'), icon: "ti ti-brush" }
        };

        let visibleNormalFn = () => vueApp && vueApp.markedElementIds.length <= 1;
        let visibleTransferPropsFn = () => vueApp && vueApp.markedElementIds.length === 1;
        let itemsElemNormal = {
            CONTEXT_ACTION_EDIT: {name: i18nService.t('gestaoEditar'), icon: "ti ti-pencil", visible: visibleNormalFn},
            CONTEXT_ACTION_DELETE: {name: i18nService.t('gestaoApagar'), icon: "ti ti-trash"},
            CONTEXT_ACTION_DUPLICATE: {name: i18nService.t('gestaoDuplicar'), icon: "ti ti-copy"},
            CONTEXT_QUICK_HIDE: { name: i18nService.t('gestaoFerrEsconderMostrar'), icon: "ti ti-eye-off" },
            TRANSFER_PROPS: {name: i18nService.t('gestaoFerrCopiarAparenciaMenu'), icon: "ti ti-brush", items: itemsTransferProps, visible: visibleTransferPropsFn},
            SEP1: "---------",
            CONTEXT_ACTION_COPY: {name: i18nService.t('gestaoFerrCopiar'), icon: "ti ti-copy"},
            CONTEXT_ACTION_CUT: {name: i18nService.t('gestaoFerrRecortar'), icon: "ti ti-cut"},
            CONTEXT_ACTION_PASTE: {name: i18nService.t('gestaoFerrColar'), icon: "ti ti-clipboard"},
            separator: { "type": "cm_separator", visible: visibleNormalFn},
            CONTEXT_GRID_NAVIGATION: {name: i18nService.t('gestaoFerrQualPrancha'), icon: "ti ti-arrow-right", visible: visibleNormalFn},
            CONTEXT_ACTION_DO_ACTION: {name: i18nService.t('gestaoFerrTestar'), icon: "ti ti-player-play", visible: visibleNormalFn},
        };

        let disabledFnFill = () => new GridData({}, vueApp.gridData).isFull();
        let itemsLayout = {
            name: i18nService.t('gestaoFerrGrupoArrumar'), icon: "ti ti-layout-grid", items: {
                'CONTEXT_LAYOUT_ALL_UP': { name: i18nService.t('gestaoFerrMoverCima'), icon: "ti ti-arrow-bar-up" },
                'CONTEXT_LAYOUT_ALL_RIGHT': { name: i18nService.t('gestaoFerrMoverDireita'), icon: "ti ti-brush" },
                'CONTEXT_LAYOUT_ALL_DOWN': { name: i18nService.t('gestaoFerrMoverBaixo'), icon: "ti ti-arrow-bar-down" },
                'CONTEXT_LAYOUT_ALL_LEFT': { name: i18nService.t('gestaoFerrMoverEsquerda'), icon: "ti ti-arrow-bar-left" },
                SEP1: "---------",
                'CONTEXT_FILL_EMPTY': {name: i18nService.t('gestaoFerrPreencher'), icon: "ti ti-square-plus-2", disabled: disabledFnFill},
                'CONTEXT_DELETE_ALL': {name: i18nService.t('gestaoFerrApagarTodos'), icon: "ti ti-trash"},
                'CONTEXT_LAYOUT_NORMALIZE': { name: i18nService.t('gestaoFerrArrumarEspacos'), icon: "ti ti-layout-board" }
            }
        };

        let visibleFn = () => vueApp.markedElementIds.length >= 1;
        var itemsMoreMenuButton = {
            "SELECTED_ELEM_ACTIONS": {name: i18nService.t('gestaoFerrGrupoEscolhidos'), icon: "ti ti-square-check", visible: visibleFn, items: itemsElemNormal},
            separator: { "type": "cm_separator", visible: visibleFn},
            CONTEXT_NEW_GROUP: contextMenuNewGroup,
            SEP0: "---------",
            'CONTEXT_COPY_ALL': {name: i18nService.t('gestaoFerrCopiarTodos'), icon: "ti ti-copy"},
            CONTEXT_ACTION_PASTE: {name: i18nService.t('gestaoFerrColar'), icon: "ti ti-clipboard"},
            SEP1: "---------",
            CONTEXT_GROUP_LAYOUT: itemsLayout,
            'CONTEXT_GRID_SETTINGS': {
                name: i18nService.t('gestaoFerrLinhasColunas'),
                icon: "ti ti-layout-grid"
            },
            'CONTEXT_GRID_TRANSLATION': {
                name: i18nService.t('gestaoFerrTraduzir'),
                icon: "ti ti-language"
            },
            'CONTEXT_EDIT_GLOBAL_GRID': {name: i18nService.t('gestaoFerrEditarBarraFixa'), icon: "ti ti-layout-navbar", visible: !vueApp.isEditingGlobalGrid},
            'CONTEXT_END_EDIT_GLOBAL_GRID': {name: i18nService.t('gestaoFerrSairBarraFixa'), icon: "ti ti-layout-navbar", visible: vueApp.isEditingGlobalGrid},
            SEP2: "---------",
            'CONTEXT_SEARCH': {name: i18nService.t('gestaoFerrProcurar'), icon: "ti ti-search"},
        };

        let ORIGIN_MORE_BTN = "ORIGIN_MORE_BTN";

        $.contextMenu({
            selector: '.child-placeholder',
            callback: function (key, options) {
                let elementId = $(this).attr('id');
                handleContextMenu(key, elementId);
            },
            items: {
                CONTEXT_ACTION_DELETE: {name: i18nService.t('gestaoApagar'), icon: "ti ti-trash"}
            },
            zIndex: 100
        });

        $.contextMenu({
            selector: '.element-container',
            callback: function (key, options) {
                let elementId = $(this).attr('id');
                handleContextMenu(key, elementId);
            },
            items: itemsElemNormal,
            zIndex: 100
        });

        $.contextMenu({
            selector: '#grid-container',
            callback: function (key, options) {
                handleContextMenu(key);
            },
            items: itemsGlobal,
            zIndex: 100
        });

        vueApp.acaoMenu = (key) => handleContextMenu(key, null, ORIGIN_MORE_BTN);

        function handleContextMenu(key, elementId, origin) {
            elementId = elementId || vueApp.markedElementIds[0];
            let createdWithinGrid = origin !== ORIGIN_MORE_BTN;
            switch (key) {
                case CONTEXT_NEW_SINGLE: {
                    vueApp.newElement(GridElement.ELEMENT_TYPE_NORMAL, createdWithinGrid);
                    break;
                }
                case CONTEXT_NEW_MASS: {
                    vueApp.newElements();
                    break;
                }
                case CONTEXT_NEW_COLLECT: {
                    vueApp.newElement(GridElement.ELEMENT_TYPE_COLLECT, createdWithinGrid);
                    break;
                }
                case CONTEXT_NEW_PREDICT: {
                    vueApp.newElement(GridElement.ELEMENT_TYPE_PREDICTION, createdWithinGrid);
                    break;
                }
                case CONTEXT_NEW_YT_PLAYER: {
                    vueApp.newElement(GridElement.ELEMENT_TYPE_YT_PLAYER, createdWithinGrid);
                    break;
                }
                case CONTEXT_NEW_LIVE: {
                    vueApp.newElement(GridElement.ELEMENT_TYPE_LIVE, createdWithinGrid);
                    break;
                }
                case CONTEXT_NEW_MATRIX_CONVERSATION: {
                    vueApp.newElement(GridElement.ELEMENT_TYPE_MATRIX_CONVERSATION, createdWithinGrid);
                    break;
                }
                case CONTEXT_NEW_CHILD_PLACEHOLDER: {
                    vueApp.newElement(GridElement.ELEMENT_TYPE_DYNAMIC_GRID_PLACEHOLDER, createdWithinGrid);
                    break;
                }
                case CONTEXT_COPY_ALL: {
                    vueApp.copyAllElements();
                    break;
                }
                case CONTEXT_DELETE_ALL: {
                    vueApp.clearElements();
                    break;
                }
                case CONTEXT_FILL_EMPTY: {
                    vueApp.fillElements();
                    break;
                }
                case CONTEXT_LAYOUT_ALL_UP: {
                    vueApp.moveAll(gridLayoutUtil.DIR_UP);
                    break;
                }
                case CONTEXT_LAYOUT_ALL_RIGHT: {
                    vueApp.moveAll(gridLayoutUtil.DIR_RIGHT);
                    break;
                }
                case CONTEXT_LAYOUT_ALL_DOWN: {
                    vueApp.moveAll(gridLayoutUtil.DIR_DOWN);
                    break;
                }
                case CONTEXT_LAYOUT_ALL_LEFT: {
                    vueApp.moveAll(gridLayoutUtil.DIR_LEFT);
                    break;
                }
                case CONTEXT_LAYOUT_NORMALIZE: {
                    vueApp.normalizeGrid();
                    break;
                }
                case CONTEXT_GRID_SETTINGS: {
                    vueApp.showGridSettingsModal = true;
                    break;
                }
                case CONTEXT_GRID_TRANSLATION: {
                    vueApp.showTranslateModal = true;
                    break;
                }
                case CONTEXT_PROPERTY_TRANSFER: {
                    vueApp.configPropTransfer(elementId);
                    break;
                }
                case CONTEXT_PROPERTY_TRANSFER_APPEARANCE: {
                    vueApp.configPropTransferAppearance(elementId);
                    break;
                }
                case CONTEXT_PROPERTY_TRANSFER_ALL: {
                    vueApp.configPropTransferAll(elementId);
                    break;
                }
                case CONTEXT_GRID_NAVIGATION: {
                    vueApp.editElementId = elementId;
                    vueApp.unmarkAll();
                    vueApp.showNavigateModal = true;
                    break;
                }
                case CONTEXT_ACTION_EDIT:
                    vueApp.editElement(elementId);
                    break;
                case CONTEXT_ACTION_DELETE:
                    vueApp.removeElements(elementId);
                    break;
                case CONTEXT_ACTION_DUPLICATE:
                    vueApp.duplicateElements(elementId);
                    break;
                case CONTEXT_QUICK_HIDE:
                    vueApp.hideUnhideElements(elementId);
                    break;
                case CONTEXT_ACTION_COPY:
                    vueApp.copyElements(elementId);
                    break;
                case CONTEXT_ACTION_CUT:
                    vueApp.cutElements(elementId);
                    break;
                case CONTEXT_ACTION_PASTE:
                    vueApp.pasteElements();
                    break;
                case CONTEXT_ACTION_DO_ACTION:
                    actionService.doAction(vueApp.gridData.id, elementId);
                    vueApp.unmarkAll();
                    break;
                case CONTEXT_EDIT_GLOBAL_GRID:
                    vueApp.toEditGlobal();
                    break;
                case CONTEXT_END_EDIT_GLOBAL_GRID:
                    vueApp.toEditChild();
                    break;
                case CONTEXT_SEARCH:
                    MainVue.showSearchModal();
                    break;
            }
        }
    }

    export default vueConfig;
</script>

<style scoped>
.edicao-tela.g-tela { min-height: 0; }

/* barra de ferramentas */
.edicao-barra {
    flex: none;
    display: flex; align-items: center; gap: var(--g-e3); flex-wrap: wrap;
    padding: var(--g-e2) var(--g-e4);
    background: var(--g-superficie);
    border-bottom: 1px solid var(--g-borda);
    position: relative; z-index: 20;
}
.edicao-nome { display: flex; flex-direction: column; align-items: flex-start; gap: 2px; min-width: 0; flex: 1 1 160px; }
.edicao-selo { min-height: 26px; background: var(--g-girassol-claro); color: #4a3b00; }
.edicao-nome-texto { font-family: var(--g-fonte-titulo); font-weight: 700; font-size: var(--g-t-h3); line-height: 1.15; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 100%; }
.edicao-ferramentas { display: flex; align-items: center; gap: var(--g-e1); flex-wrap: wrap; justify-content: flex-end; }
.edicao-ferr {
    display: inline-flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px;
    min-width: 64px; min-height: 56px; height: auto; padding: var(--g-e1) var(--g-e2); margin: 0;
    border: 2px solid transparent; border-radius: var(--g-raio); background: transparent;
    font-family: var(--g-fonte); font-size: var(--g-t-legenda); font-weight: 700; color: var(--g-tinta);
    text-transform: none; letter-spacing: 0; line-height: 1.1; white-space: nowrap; cursor: pointer;
}
.edicao-ferr .ti { font-size: 25.6px; color: var(--g-folha-escura); }
.edicao-ferr:hover { background: var(--g-folha-clara); }
.edicao-ferr:active { transform: scale(0.97); }
.edicao-ferr:focus-visible { outline: none; box-shadow: var(--g-foco); }
.edicao-ferr[disabled] { opacity: 0.4; cursor: not-allowed; background: transparent; transform: none; }
.edicao-ferr-destaque { background: var(--g-folha-clara); border-color: var(--g-folha); }
.edicao-concluir { margin-left: var(--g-e2); min-height: 56px; }
/* the old global "header" rules (max-height 40px, floating buttons) do not apply to this bar */
header.edicao-barra { max-height: none; height: auto; }
header.edicao-barra div { display: flex; }
header.edicao-barra button { float: none; height: auto; font-size: var(--g-t-legenda); }
header.edicao-barra button.edicao-concluir { font-size: var(--g-t-corpo); }
@media (max-width: 420px) {
    .edicao-concluir span { display: none; }
    .edicao-concluir .ti { margin: 0; }
}

/* faixa dos botões escolhidos / dica */
.edicao-selecao {
    flex: none;
    display: flex; align-items: center; gap: var(--g-e2); flex-wrap: wrap;
    padding: var(--g-e2) var(--g-e4);
    background: var(--g-girassol-claro);
    border-bottom: 1px solid var(--g-borda);
}
.edicao-selecao-texto { font-weight: 700; margin-right: auto; }
.edicao-sel-btn { padding: 0 var(--g-e3); }
.edicao-dica {
    flex: none; margin: 0;
    display: flex; align-items: center; gap: var(--g-e2);
    padding: var(--g-e2) var(--g-e4);
    color: var(--g-tinta-2); font-size: var(--g-t-legenda);
    background: var(--g-fundo);
}
.edicao-dica .ti { font-size: 19.2px; color: var(--g-folha-escura); }
.edicao-transferir {
    flex: none;
    display: flex; align-items: center; gap: var(--g-e3); flex-wrap: wrap;
    padding: var(--g-e2) var(--g-e4);
    background: var(--g-ceu); color: var(--g-ceu-escuro);
    border-bottom: 1px solid var(--g-borda);
}
.edicao-transferir > .ti { font-size: 25.6px; }
.edicao-transferir-texto { flex: 1 1 200px; }

.edicao-area { flex: 1 1 auto; position: relative; }
.edicao-carregando { display: grid; place-items: center; height: 100%; }
.edicao-carregando .ti { font-size: 48px; color: var(--g-folha); animation: edicao-giro 1s linear infinite; }
@keyframes edicao-giro { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) { .edicao-carregando .ti { animation: none; } }

/* painéis (Cor e Mais) */
.edicao-painel.g-tela { min-height: 0; }
.edicao-painel-cabeca { display: flex; align-items: center; gap: var(--g-e2); margin-bottom: var(--g-e3); }
.edicao-painel-cabeca h2 { flex: 1; margin: 0; font-size: var(--g-t-h3); display: flex; align-items: center; gap: var(--g-e2); }
.edicao-painel-cabeca h2 .ti { color: var(--g-folha-escura); }
.edicao-cor-alvo { margin-bottom: var(--g-e3); }
.edicao-cor-alvo .gm-aba[disabled] { opacity: 0.5; cursor: not-allowed; }
.edicao-cores { display: grid; grid-template-columns: repeat(auto-fill, minmax(88px, 1fr)); gap: var(--g-e2); margin: var(--g-e3) 0 var(--g-e4); }
.edicao-cor {
    display: flex; flex-direction: column; align-items: center; gap: var(--g-e1);
    min-height: 88px; height: auto; margin: 0; padding: var(--g-e2);
    background: var(--g-superficie); border: 2px solid var(--g-borda); border-radius: var(--g-raio);
    font-family: var(--g-fonte); font-size: var(--g-t-legenda); font-weight: 700; color: var(--g-tinta);
    text-transform: none; letter-spacing: 0; line-height: 1.2; cursor: pointer;
}
.edicao-cor:hover { border-color: var(--g-borda-forte); }
.edicao-cor:focus-visible { outline: none; box-shadow: var(--g-foco); }
.edicao-cor-amostra { width: 44px; height: 44px; border-radius: 50%; border: 2px solid rgba(38, 59, 28, 0.18); display: grid; place-items: center; }
.edicao-cor-nenhuma { background: repeating-linear-gradient(45deg, #fff, #fff 6px, var(--g-superficie-2) 6px, var(--g-superficie-2) 12px); color: var(--g-tinta-3); font-size: 20.8px; }
.edicao-cor-livre { max-width: 240px; }
.edicao-cor-livre input[type="color"] { width: 100%; min-height: var(--g-alvo); border-radius: var(--g-raio); border: 2px solid var(--g-borda); padding: 4px; background: var(--g-superficie); margin: 0; }

.edicao-grupo { margin-bottom: var(--g-e4); }
.edicao-grupo h3 { font-size: var(--g-t-corpo); color: var(--g-tinta-2); margin: 0 0 var(--g-e2); }
.edicao-itens { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: var(--g-e2); }
.edicao-item {
    display: flex; align-items: center; gap: var(--g-e3);
    min-height: var(--g-alvo-g); height: auto; margin: 0; padding: var(--g-e2) var(--g-e4);
    background: var(--g-superficie); border: 2px solid var(--g-borda); border-radius: var(--g-raio);
    font-family: var(--g-fonte); font-size: var(--g-t-corpo); font-weight: 700; color: var(--g-tinta);
    text-transform: none; letter-spacing: 0; text-align: left; line-height: 1.2; white-space: normal; cursor: pointer;
}
.edicao-item .ti { font-size: 24px; color: var(--g-folha-escura); flex: none; }
.edicao-item:hover { border-color: var(--g-borda-forte); background: var(--g-folha-clara); }
.edicao-item:focus-visible { outline: none; box-shadow: var(--g-foco); }
.edicao-item[disabled] { opacity: 0.45; cursor: not-allowed; background: var(--g-superficie); }
.edicao-item-perigo { color: var(--g-perigo); }
.edicao-item-perigo .ti { color: var(--g-perigo); }
.edicao-item-perigo:hover { background: var(--g-perigo-claro); border-color: var(--g-perigo); }

/* tablet em pé e celular: só ícones na barra, nome em cima */
@media (max-width: 900px) {
    .edicao-ferr { min-width: 52px; }
}
@media (max-width: 720px) {
    .edicao-barra { padding: var(--g-e2); gap: var(--g-e2); }
    .edicao-nome { flex: 1 1 100%; flex-direction: row; align-items: center; gap: var(--g-e2); }
    .edicao-nome-texto { font-size: var(--g-t-grande); }
    .edicao-ferramentas { flex: 1 1 100%; justify-content: space-between; gap: 0; flex-wrap: nowrap; }
    .edicao-ferr { min-width: 44px; min-height: var(--g-alvo); padding: 2px; flex: 1 1 0; }
    .edicao-ferr span { display: none; }
    .edicao-concluir { margin-left: var(--g-e1); padding: 0 var(--g-e3); min-height: var(--g-alvo); flex: none; }
    .edicao-selecao { padding: var(--g-e2); }
    .edicao-selecao-texto { flex: 1 1 100%; }
    .edicao-sel-btn { flex: 1 1 auto; padding: 0 var(--g-e2); }
    .edicao-sel-btn span { display: none; }
    .edicao-dica { padding: var(--g-e1) var(--g-e3); }
    .edicao-itens { grid-template-columns: minmax(0, 1fr); }
}
@media print {
    .no-print { display: none !important; }
}
</style>

<style>
/* menu de toque longo / botão direito (jQuery contextMenu, fica fora do componente) com o visual novo */
.context-menu-list {
    font-family: "Atkinson Hyperlegible", system-ui, sans-serif;
    border-radius: 16px;
    border: 2px solid var(--g-borda, #e6dcc3);
    box-shadow: 0 1px 2px rgba(38, 59, 28, 0.06), 0 4px 14px rgba(38, 59, 28, 0.08);
    padding: 6px;
    min-width: 15em;
}
.context-menu-item {
    border-radius: 10px;
    padding: 0.7em 1em 0.7em 2.8em;
    font-size: 16px;
    color: var(--g-tinta, #263b1c);
    background: transparent;
}
.context-menu-item.context-menu-hover, .context-menu-item.context-menu-visible {
    background: var(--g-folha-clara, #e4f2dc);
    color: var(--g-tinta, #263b1c);
}
.context-menu-separator { border-bottom: 1px solid var(--g-borda, #e6dcc3); padding: 0; margin: 4px 6px; }
.context-menu-list .context-menu-item.context-menu-icon { padding-left: 2.8em; }
.context-menu-icon.context-menu-icon-ti::before {
    font-family: "tabler-icons-outline" !important;
    font-size: 1.3em;
    width: 1.4em;
    text-align: center;
    left: 0.4em;
    color: var(--g-folha-escura, #2f6b1f);
}
.context-menu-icon.context-menu-icon-ti.context-menu-hover::before { color: var(--g-folha-escura, #2f6b1f); }
.context-menu-icon.context-menu-icon-ti.context-menu-disabled::before { color: #bbb; }
.context-menu-submenu:after { border-color: transparent transparent transparent var(--g-tinta-2, #55594f); }
</style>
