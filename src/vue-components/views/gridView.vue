<template>
    <div class="box prancha" id="gridView" v-cloak>
        <div class="prancha-area" v-show="!renderGridData">
            <div class="prancha-carregando" role="status" :aria-label="$t('pranchaCarregando')">
                <i class="ti ti-loader-2" aria-hidden="true"></i>
            </div>
        </div>

        <huffman-input-modal v-if="showModal === modalTypes.MODAL_HUFFMAN" @close="showModal = null; reloadInputMethods();" />
        <direction-input-modal v-if="showModal === modalTypes.MODAL_DIRECTION" @close="showModal = null; reloadInputMethods();"/>
        <mouse-modal v-if="showModal === modalTypes.MODAL_MOUSE" @close="showModal = null; reloadInputMethods();"/>
        <scanning-modal v-if="showModal === modalTypes.MODAL_SCANNING" @close="showModal = null; reloadInputMethods();"/>
        <sequential-input-modal v-if="showModal === modalTypes.MODAL_SEQUENTIAL" @close="showModal = null; reloadInputMethods();"/>
        <unlock-modal v-if="showModal === modalTypes.MODAL_UNLOCK" @unlock="onPasscodeOk()" @close="closeUnlockModal()"/>
        <edit-element-quick v-if="quickEditElementId" :grid-ids="quickEditGridIds" :element-id="quickEditElementId" :inicio="quickEditStart" @close="closeQuickEdit()" @changed="rerenderGrid()"/>

        <div class="prancha-area prancha-vazia" v-if="renderGridData && renderGridData.gridElements.length === 0">
            <div class="g-cartao prancha-vazia-cartao">
                <i class="ti ti-layout-grid-add prancha-vazia-icone" aria-hidden="true"></i>
                <h2 class="prancha-vazia-titulo">{{ $t('pranchaVaziaTitulo') }}</h2>
                <p class="g-apoio">{{ $t('pranchaVaziaTexto') }}</p>
                <button type="button" class="g-btn g-btn-principal g-btn-grande" @click="usePanelAction('editar')">
                    <i class="ti ti-pencil" aria-hidden="true"></i>{{ $t('pranchaEditarPrancha') }}
                </button>
            </div>
        </div>
        <div class="prancha-area" v-if="showGrid && renderGridData && renderGridData.gridElements.length > 0">
            <app-grid-display id="grid-container" :grid-data="renderGridData" :metadata="metadata" :elem-css-fn="(elem) => gridUtil.getElemBackgroundCss(elem, renderGridData, globalGridData, metadata.colorConfig.gridBackgroundColor) + (elem.hidden ? HIDDEN_ELEM_CSS : '')"/>
        </div>

        <div class="prancha-rodape" v-if="metadata">
            <div v-if="choosingPhotoTarget" class="prancha-escolher-foto" role="status">
                <i class="ti ti-camera" aria-hidden="true"></i>
                <span class="prancha-escolher-foto-texto">{{ $t('pranchaToqueNoBotaoDaFoto') }}</span>
                <button type="button" class="g-btn" @click="choosingPhotoTarget = false">{{ $t('cancel') }}</button>
            </div>
            <span class="prancha-rodape-dica" v-else-if="!metadata.locked">
                <i class="ti ti-hand-click" aria-hidden="true"></i>
                <span>{{ $t('pranchaDicaSegurarBotao') }}</span>
            </span>
            <span class="g-espaco"></span>
            <painel-responsavel :aberto="panelOpen" :modo-crianca="!!metadata.locked" :segurar-ms="unlockHoldMs"
                                :tela-cheia="!!metadata.fullscreen" :input-config="metadata.inputConfig"
                                @quer-abrir="requestPanel()" @fechar="closePanel()" @escolher="usePanelAction"/>
        </div>
    </div>
</template>

<script>
    import $ from '../../js/externals/jquery.js';
    import {L} from "../../js/util/lquery.js";
    import {actionService} from "../../js/service/actionService";
    import {dataService} from "../../js/service/data/dataService";
    import {areService} from "../../js/service/areService";
    import {Router} from "./../../js/router.js";
    import {MetaData} from "../../js/model/MetaData.js";
    import {urlParamService} from "../../js/service/urlParamService";

    import {Scanner} from "../../js/input/scanning.js";
    import {Hover} from "../../js/input/hovering.js";
    import {Clicker} from "../../js/input/clicking.js";
    import {HuffmanInput} from "../../js/input/huffmanInput";
    import {DirectionInput} from "../../js/input/directionInput";
    import {SequentialInput} from "../../js/input/sequentialInput";

    import {constants} from "../../js/util/constants";
    import {i18nService} from "../../js/service/i18nService";
    import {util} from "../../js/util/util";
    import ScanningModal from '../../vue-components/modals/input/scanningModal.vue'
    import MouseModal from "../modals/input/mouseModal.vue";
    import DirectionInputModal from "../modals/input/directionInputModal.vue";
    import HuffmanInputModal from "../modals/input/huffmanInputModal.vue";
    import SequentialInputModal from "../modals/input/sequentialInputModal.vue";
    import {speechService} from "../../js/service/speechService";
    import {localStorageService} from "../../js/service/data/localStorageService";
    import {imageUtil} from "../../js/util/imageUtil";
    import {audioUtil} from "../../js/util/audioUtil.js";
    import UnlockModal from "../modals/unlockModal.vue";
    import PainelResponsavel from "../components/painelResponsavel.vue";
    import EditElementQuick from "../modals/editElementQuick.vue";
    import {holdGesture} from "../../js/input/holdGesture";
    import {unlockHoldService} from "../../js/service/unlockHoldService";
    import {MainVue} from "../../js/vue/mainVue.js";
    import {stateService} from "../../js/service/stateService.js";
    import { systemActionService } from '../../js/service/systemActionService';
    import AppGridDisplay from '../grid-display/appGridDisplay.vue';
    import { gridUtil } from '../../js/util/gridUtil';
    import { collectElementService } from '../../js/service/collectElementService';
    import { predictionService } from '../../js/service/predictionService';
    import { liveElementService } from '../../js/service/liveElementService';
    import { GridElement } from '../../js/model/GridElement';

    let vueApp = null;
    let UNLOCK_COUNT = 8;
    let QUICK_EDIT_HOLD_MS = 1000; // Grilo Falante: hold a button 1 second in adult mode to open the quick edit panel
    let HIDDEN_ELEM_CSS = ' opacity: 0.35; filter: grayscale(1);'; // hidden buttons, only visible in adult mode
    // targets of the tiles of the "Painel do Responsável" that open other screens
    let PANEL_ROUTES = {
        inicio: '#inicio',
        trocar: '#welcome',
        voz: '#settings?secao=voz',
        aparencia: '#settings?secao=aparencia',
        ajustes: '#settings'
    };
    let modalTypes = {
        MODAL_SCANNING: 'MODAL_SCANNING',
        MODAL_MOUSE: 'MODAL_MOUSE',
        MODAL_DIRECTION: 'MODAL_DIRECTION',
        MODAL_HUFFMAN: 'MODAL_HUFFMAN',
        MODAL_SEQUENTIAL: 'MODAL_SEQUENTIAL',
        MODAL_UNLOCK: 'MODAL_UNLOCK'
    };

    let vueConfig = {
        props: {
            gridId: String,
            skipThumbnailCheck: Boolean
        },
        data() {
            return {
                globalGridData: null,
                renderGridData: null,
                showGrid: false,
                metadata: null,
                updatedMetadataDoc: null,
                scanner: null,
                hover: null,
                clicker: null,
                directionInput: null,
                seqInput: null,
                huffmanInput: null,
                inputMethodsInitialized: false,
                showModal: null,
                modalTypes: modalTypes,
                unlockCount: UNLOCK_COUNT,
                unlockCounter: UNLOCK_COUNT,
                unlockHoldMs: unlockHoldService.getHoldMs(), // chosen in Ajustes > Modo Criança (default 3 s)
                hasPasscode: !!localStorageService.getAppSettings().unlockPasscode,
                quickEditElementId: null,
                quickEditGridIds: [],
                quickEditStart: null,
                panelOpen: false,
                choosingPhotoTarget: false,
                suppressSelectionUntil: 0,
                detachQuickEditHold: null,
                HIDDEN_ELEM_CSS: HIDDEN_ELEM_CSS,
                MainVue: MainVue,
                highlightTimeoutHandler: null,
                highlightedElementId: null,
                systemActionService: systemActionService,
                gridUtil: gridUtil
            }
        },
        components: {
            AppGridDisplay,
            UnlockModal,
            PainelResponsavel,
            EditElementQuick,
            SequentialInputModal,
            HuffmanInputModal,
            DirectionInputModal,
            MouseModal,
            ScanningModal
        },
        methods: {
            openModal(modalType) {
                this.showModal = modalType;
                stopInputMethods();
            },
            lock() {
                let thiz = this;
                thiz.metadata.locked = true;
                thiz.unlockCounter = UNLOCK_COUNT;
                thiz.hasPasscode = !!localStorageService.getAppSettings().unlockPasscode;
                return dataService.saveMetadata(thiz.metadata).then(() => {
                    this.setViewPropsLocked();
                    return this.rerenderGrid();
                });
            },
            /**
             * leaves the child mode. Without "force" a passcode (if set) is asked first.
             * @return {Promise<void>}
             */
            unlock(force) {
                let thiz = this;
                if (!force && localStorageService.getAppSettings().unlockPasscode) {
                    thiz.showModal = modalTypes.MODAL_UNLOCK;
                    return Promise.resolve();
                }
                thiz.unlockCounter--;
                util.debounce(function () {
                    thiz.unlockCounter = UNLOCK_COUNT;
                }, 3000);
                if (thiz.unlockCounter === 0 || force) {
                    thiz.metadata.locked = false;
                    return dataService.saveMetadata(thiz.metadata).then(() => {
                        if (MainVue.restoreSidebar) {
                            MainVue.restoreSidebar();
                        }
                        this.setViewPropsUnlocked();
                        return this.rerenderGrid();
                    });
                }
                return Promise.resolve();
            },
            /**
             * the "Responsável" button was held (child mode) or tapped (adult mode):
             * in child mode with a passcode, the passcode is asked before the panel opens.
             */
            requestPanel() {
                this.choosingPhotoTarget = false;
                this.hasPasscode = !!localStorageService.getAppSettings().unlockPasscode;
                if (this.metadata && this.metadata.locked && this.hasPasscode) {
                    this.openModal(modalTypes.MODAL_UNLOCK);
                    return;
                }
                this.openPanel();
            },
            openPanel() {
                stopInputMethods();
                this.panelOpen = true;
            },
            closePanel(dontRestartInput) {
                this.panelOpen = false;
                if (dontRestartInput !== true) {
                    this.initInputMethods({continueInputMethods: true});
                }
            },
            onPasscodeOk() {
                this.showModal = null;
                this.openPanel();
            },
            closeUnlockModal() {
                if (this.showModal === modalTypes.MODAL_UNLOCK) {
                    this.showModal = null;
                }
                if (!this.panelOpen) {
                    this.initInputMethods({continueInputMethods: true});
                }
            },
            /**
             * leaves the child mode without asking again (the adult already held the button / typed the passcode)
             */
            async leaveChildMode() {
                if (this.metadata && this.metadata.locked) {
                    await this.unlock(true);
                }
            },
            async usePanelAction(action, extra) {
                let gridId = this.renderGridData ? this.renderGridData.id : this.gridId;
                switch (action) {
                    case 'modo':
                        if (this.metadata.locked) {
                            await this.unlock(true);
                        } else {
                            await this.lock();
                        }
                        stopInputMethods(); // the grid was reloaded, but the panel stays open to show the new state
                        return;
                    case 'foto':
                        this.closePanel();
                        this.choosingPhotoTarget = true;
                        return;
                    case 'frases':
                        this.closePanel();
                        MainVue.showPhraseHistoryModal();
                        return;
                    case 'procurar':
                        this.closePanel();
                        MainVue.showSearchModal();
                        return;
                    case 'telaCheia':
                        this.closePanel();
                        if (this.metadata.fullscreen) {
                            systemActionService.exitFullscreen();
                        } else {
                            systemActionService.enterFullscreen();
                        }
                        return;
                    case 'entrada':
                        this.panelOpen = false;
                        if (extra && modalTypes[extra]) {
                            this.openModal(modalTypes[extra]);
                        } else {
                            this.initInputMethods({continueInputMethods: true});
                        }
                        return;
                }
                let targets = {
                    editar: () => Router.toEditGrid(gridId),
                    pranchas: () => Router.toManageGrids(),
                    voz: () => Router.to(PANEL_ROUTES.voz),
                    aparencia: () => Router.to(PANEL_ROUTES.aparencia),
                    ajustes: () => Router.to(PANEL_ROUTES.ajustes),
                    trocar: () => Router.to(PANEL_ROUTES.trocar),
                    inicio: () => Router.to(PANEL_ROUTES.inicio)
                };
                if (!targets[action]) {
                    return;
                }
                this.closePanel(true);
                await this.leaveChildMode(); // the router only allows the board in child mode
                targets[action]();
            },
            setViewPropsLocked() {
                $(document).trigger(constants.EVENT_SIDEBAR_CLOSE);
                $(document).trigger(constants.EVENT_UI_LOCKED);
                document.body.classList.add(constants.CLASS_UI_LOCKED);

                // prevent zoom
                $('#viewPortMeta').attr('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no');
                $('#gridView').on('touchmove', this.preventZoomHandler);
            },
            setViewPropsUnlocked() {
                $(document).trigger(constants.EVENT_UI_UNLOCKED);

                //enable zoom
                $('#viewPortMeta').attr('content', 'width=device-width, initial-scale=1');
                document.body.classList.remove(constants.CLASS_UI_LOCKED);
                $('#gridView').off('touchmove', this.preventZoomHandler);
            },
            isHiddenElement(id) {
                let elem = this.renderGridData ? this.renderGridData.gridElements.find(e => e.id === id) : null;
                return !!(elem && elem.hidden);
            },
            openQuickEdit(target, start) {
                if (!target || !target.id || !this.renderGridData) {
                    return;
                }
                this.suppressSelectionUntil = new Date().getTime() + 1500;
                stopInputMethods();
                let globalGridId = this.renderGridData.globalGridId || (this.globalGridData ? this.globalGridData.id : null);
                this.quickEditGridIds = [this.renderGridData.id, globalGridId];
                this.quickEditStart = start || null;
                this.quickEditElementId = target.id;
            },
            closeQuickEdit() {
                this.quickEditElementId = null;
                this.quickEditStart = null;
                this.suppressSelectionUntil = new Date().getTime() + 300;
                this.initInputMethods({continueInputMethods: true});
            },
            preventZoomHandler(event) {
                if (event.target && event.target.closest && event.target.closest('.g-painel, .modal')) {
                    return; // panels of the adult can scroll
                }
                event.preventDefault();
            },
            reloadInputMethods() {
                this.initInputMethods({reload: true});
            },
            async initInputMethods(options = {}) {
                options.continueInputMethods = options.continueInputMethods || false;
                options.reload = options.reload || false;
                if (this.inputMethodsInitialized) {
                    stopInputMethods();
                }
                if (options.reload) {
                    let metadata = await dataService.getMetadata();
                    this.metadata = JSON.parse(JSON.stringify(metadata));
                }
                let thiz = this;
                let inputConfig = thiz.metadata.inputConfig;
                let selectionListener = (item) => {
                    if (this.choosingPhotoTarget) {
                        this.choosingPhotoTarget = false; // "Foto nova" of the panel: this button gets the new photo
                        this.openQuickEdit(item, 'foto');
                        return;
                    }
                    if (new Date().getTime() < this.suppressSelectionUntil || this.isHiddenElement(item.id)) {
                        return; // release after opening the quick edit panel, or hidden button (adult mode)
                    }
                    this.stopHighlightElements();
                    L.removeAddClass(item, 'selected');
                    actionService.doAction(thiz.renderGridData, item.id);
                };
                let activeListener = (items, wrap, restarted) => {
                    if (!Array.isArray(items)) {
                        items = [items];
                    }
                    if (inputConfig.globalReadActive && items && items.length === 1 && items[0]) {
                        let text = items[0].ariaLabel || '';
                        let separatorIndex = text.indexOf(", ");
                        if (!inputConfig.globalReadAdditionalActions && separatorIndex !== -1 && separatorIndex !== 0) {
                            text = text.substring(0, separatorIndex);
                        }
                        speechService.speak(text, {
                            rate: inputConfig.globalReadActiveRate || 1
                        });
                    }

                    if (inputConfig.globalBeepFeedback) {
                        if (restarted) {
                            audioUtil.beepHighDouble();
                        } else if (wrap) {
                            audioUtil.beepHigh();
                        } else {
                            audioUtil.beep();
                        }
                    }
                };

                if (inputConfig.seqEnabled) {
                    thiz.seqInput = SequentialInput.getInstanceFromConfig(inputConfig, {
                        itemSelector: '.element-container:not([data-empty="true"])',
                        selectionListener: selectionListener,
                        activeListener: activeListener
                    });
                    thiz.seqInput.start(options.continueInputMethods);
                }

                if (inputConfig.dirEnabled) {
                    thiz.directionInput = DirectionInput.getInstanceFromConfig(inputConfig, '.element-container:not([data-empty="true"])', 'scanFocus', selectionListener);
                    thiz.directionInput.start();
                }

                if (inputConfig.huffEnabled) {
                    this.huffmanInput = HuffmanInput.getInstanceFromConfig(inputConfig, '.element-container', 'scanFocus', 'scanInactive', selectionListener);
                    this.huffmanInput.start();
                }

                if (inputConfig.scanEnabled) {
                    thiz.scanner = Scanner.getInstanceFromConfig(inputConfig, '.element-container:not([data-empty="true"])', 'scanFocus', 'scanInactive');
                    thiz.scanner.setSelectionListener(selectionListener);
                    thiz.scanner.setActiveListener(activeListener);
                    thiz.scanner.startScanning(options.continueInputMethods);
                }

                if (inputConfig.hoverEnabled) {
                    thiz.hover = Hover.getInstanceFromConfig(inputConfig, '.element-container', {
                        activeListener: activeListener,
                        containerClass: '.grid-container li'
                    });
                    thiz.hover.setSelectionListener(selectionListener);
                    thiz.hover.startHovering();
                } else {
                    $('#touchElement').hide();
                }

                if (inputConfig.mouseclickEnabled || inputConfig.mouseDoubleClickEnabled) {
                    thiz.clicker = Clicker.getInstanceFromConfig(inputConfig, '.element-container');
                    thiz.clicker.setSelectionListener(selectionListener);
                    thiz.clicker.startClickcontrol();
                }
                this.inputMethodsInitialized = true;
            },
            async onNavigateEvent(event, gridData, params) {
                await this.loadGrid(gridData, { continueInputMethods: true });
            },
            async loadGrid(gridData, options = {}) {
                options.continueInputMethods = options.continueInputMethods || false;
                options.forceReload = options.forceReload || false;
                collectElementService.clearCollectElements();
                if (gridData && (options.forceReload || !this.renderGridData || this.renderGridData.id !== gridData.id)) {
                    if (gridUtil.hasAREModel(gridData)) {
                        let areModel = gridUtil.getAREModel(gridData);
                        areService.uploadAndStartModel(areModel.dataBase64, gridUtil.getAREURL(gridData), areModel.fileName);
                    }

                    // this line before recalculateRenderGrid since it changes gridData!
                    let updateThumbnail = gridUtil.hasOutdatedThumbnail(gridData) && !this.skipThumbnailCheck;

                    await this.recalculateRenderGrid(gridData);
                    Router.addToGridHistory(this.renderGridData.id);

                    if (updateThumbnail) {
                        imageUtil.allImagesLoaded().then(async () => {
                            let screenshot = await imageUtil.getScreenshot("#grid-container");
                            let thumbnail = {
                                data: screenshot,
                                shouldUpdate: false
                            };
                            dataService.saveThumbnail(this.renderGridData.id, thumbnail);
                        })
                    }

                    if (this.metadata.lastOpenedGridId !== gridData.id) {
                        this.metadata.lastOpenedGridId = gridData.id;
                        await dataService.saveMetadata(this.metadata);
                    }
                }

                await this.$nextTick();
                this.initInputMethods(options);
                this.highlightElements();
                await predictionService.initWithElements(this.renderGridData.gridElements);
                collectElementService.initWithGrid(this.renderGridData);
                liveElementService.initWithElements(this.renderGridData.gridElements);
                $(document).trigger(constants.EVENT_GRID_LOADED);
            },
            highlightElements() {
                clearTimeout(this.highlightTimeoutHandler);
                let params = urlParamService.getSearchQueryParams();
                if (params.highlightIds) {
                    $(`#${params.highlightIds[0]}`).addClass('highlight');
                    this.highlightTimeoutHandler = setTimeout(() => {
                        this.stopHighlightElements();
                    }, 15000);
                    this.highlightedElementId = params.highlightIds[0];
                    params.highlightIds.shift();
                    params.highlightIds = params.highlightIds.length > 0 ? params.highlightIds : null;
                    urlParamService.setParamsToSearchQuery(params);
                }
            },
            stopHighlightElements() {
                if (this.highlightedElementId) {
                    $(`#${this.highlightedElementId}`).removeClass('highlight');
                    this.highlightedElementId = null;
                }
            },
            toEditGrid() {
                Router.toEditGrid(this.renderGridData.id);
            },
            toLogin() {
                Router.toLogin();
            },
            async onExternalUpdate(event, updatedIds, updatedDocs, deletedIds) {
                let thiz = this;
                if (!vueApp) {
                    setTimeout(() => {
                        thiz.onExternalUpdate(event, updatedIds, updatedDocs);
                    }, 500);
                    return;
                }
                if (deletedIds.includes(vueApp.gridId)) {
                    Router.toManageGrids();
                    return;
                }
                log.debug('got update event, ids updated:' + updatedIds);
                let updatedGridDoc = updatedDocs.filter(doc => (vueApp.renderGridData && doc.id === vueApp.renderGridData.id))[0];
                let hasUpdatedGlobalGrid = updatedDocs.filter(doc => (this.metadata && doc.id === this.metadata.globalGridId)).length > 0;
                this.updatedMetadataDoc = updatedDocs.filter(doc => (vueApp.metadata && doc.id === vueApp.metadata.id))[0] || this.updatedMetadataDoc;
                if (updatedGridDoc) {
                    let gridDoc = await dataService.getGrid(updatedGridDoc.id); // get again in order to be sure to have correct revision on conflicts
                    vueApp.loadGrid(gridDoc, { continueInputMethods: true, forceReload: true });
                } else if (hasUpdatedGlobalGrid) {
                    let gridData = await dataService.getGrid(vueApp.renderGridData.id, false, true);
                    this.globalGridData = await dataService.getGlobalGrid();
                    vueApp.loadGrid(gridData, { continueInputMethods: true, forceReload: true });
                }
                if (localStorageService.getAppSettings().syncNavigation) {
                    if (this.updatedMetadataDoc && this.updatedMetadataDoc.lastOpenedGridId !== vueApp.renderGridData.id) {
                        dataService.getGrid(this.updatedMetadataDoc.lastOpenedGridId).then(toGrid => {
                            if (!gridUtil.hasOutdatedThumbnail(toGrid)) {
                                Router.toLastOpenedGrid();
                            }
                        });
                        return;
                    }
                    if (this.updatedMetadataDoc && this.updatedMetadataDoc.fullscreen !== vueApp.metadata.fullscreen) {
                        if (this.updatedMetadataDoc.fullscreen) {
                            systemActionService.enterFullscreen(true);
                        } else if (MainVue.restoreSidebar) {
                            MainVue.restoreSidebar();
                        }
                    }
                    if (this.updatedMetadataDoc && this.updatedMetadataDoc.locked !== vueApp.metadata.locked) {
                        if (this.updatedMetadataDoc.locked) {
                            vueApp.lock();
                        } else {
                            vueApp.unlock(true);
                        }
                    }
                }
                this.metadata = this.updatedMetadataDoc || this.metadata;
            },
            async recalculateRenderGrid(gridData) {
                // attention: gridData also changes because of "noDeepCopy: true"
                // just using this.renderGridData for clarity
                this.showGrid = false;
                let globalGrid = null;
                gridData = gridUtil.fillFreeSpaces(gridData, GridElement.ELEMENT_TYPE_UI_FILLER);
                if (gridUtil.hasDynamicGridPlaceholder(this.globalGridData)) {
                    this.globalGridData = gridUtil.fillFreeSpaces(this.globalGridData, GridElement.ELEMENT_TYPE_UI_FILLER);
                }
                if (gridData.showGlobalGrid) {
                    globalGrid = this.globalGridData;
                    if (gridData.globalGridId) { // custom global grid
                        globalGrid = await dataService.getGrid(gridData.globalGridId, false, true);
                    }
                    this.renderGridData = gridUtil.mergeGrids(gridData, globalGrid, {
                        globalGridHeightPercentage: this.metadata.globalGridHeightPercentage,
                        noDeepCopy: true
                    });
                } else {
                    this.renderGridData = gridData;
                }
                this.renderGridData = gridUtil.adaptFirstRowHeight(this.renderGridData, this.metadata.firstRowHeightFactor);
                this.renderGridData.minColumnCount = gridUtil.getWidthWithBounds(this.renderGridData);
                this.renderGridData.rowCount = gridUtil.getHeightWithBounds(this.renderGridData);
                // hidden buttons keep their place: empty in child mode, shown faded in adult mode (see HIDDEN_ELEM_CSS)
                this.renderGridData.gridElements = this.renderGridData.gridElements.filter(e => !e.hidden || !this.metadata.locked);

                let effectiveLevel = gridUtil.getCurrentVocabularyLevel(this.metadata);

                if (effectiveLevel) {
                    let globalGridElements = globalGrid ? globalGrid.gridElements : [];
                    let globalGridElemIds = globalGridElements.map(e => e.id);
                    let normalGridElements = this.renderGridData.gridElements.filter(e => !globalGridElemIds.includes(e.id));
                    let shownElementIds = gridUtil.getElementsOfVocabularyLevel(normalGridElements, effectiveLevel).concat(gridUtil.getElementsOfVocabularyLevel(globalGridElements, effectiveLevel)).map(e => e.id);
                    this.renderGridData.gridElements = this.renderGridData.gridElements.filter(e => shownElementIds.includes(e.id));
                }
                this.showGrid = true;
                stateService.setCurrentGrid(this.renderGridData);
            },
            onSidebarOpen() {
                if (!vueApp || !vueApp.metadata) {
                    return;
                }
                vueApp.metadata.fullscreen = false;
                $(document).trigger(constants.EVENT_GRID_RESIZE);
            },
            resizeListener() {
                let thiz = this;
                util.debounce(function () {
                    if (thiz.huffmanInput) {
                        thiz.huffmanInput.reinit();
                    }
                }, 500);
            },
            contextMenuListener(event) {
                event.preventDefault();
            },
            async metadataUpdated() {
                this.metadata = await dataService.getMetadata();
            },
            async rerenderGrid() {
                if (this.renderGridData) {
                    // Reload the grid with fresh data without updating metadata
                    let freshGridData = await dataService.getGrid(this.renderGridData.id);
                    await this.loadGrid(freshGridData, { forceReload: true });
                }
            }
        },
        created() {
            $(document).on(constants.EVENT_DB_PULL_UPDATED, this.onExternalUpdate);
            $(document).on(constants.EVENT_SIDEBAR_OPEN, this.onSidebarOpen);
            $(document).on(constants.EVENT_NAVIGATE_GRID_IN_VIEWMODE, this.onNavigateEvent);
            document.addEventListener('contextmenu', this.contextMenuListener);
            window.addEventListener('resize', this.resizeListener, true);
            $(document).on(constants.EVENT_GRID_RESIZE, this.resizeListener);
            $(document).on(constants.EVENT_METADATA_UPDATED, this.metadataUpdated);
            $(document).on(constants.EVENT_GRID_RERENDER, this.rerenderGrid);
        },
        beforeDestroy() {
            $(document).off(constants.EVENT_DB_PULL_UPDATED, this.onExternalUpdate);
            $(document).off(constants.EVENT_SIDEBAR_OPEN, this.onSidebarOpen);
            $(document).off(constants.EVENT_NAVIGATE_GRID_IN_VIEWMODE, this.onNavigateEvent);
            document.removeEventListener('contextmenu', this.contextMenuListener);
            window.removeEventListener('resize', this.resizeListener, true);
            $(document).off(constants.EVENT_GRID_RESIZE, this.resizeListener);
            $(document).off(constants.EVENT_METADATA_UPDATED, this.metadataUpdated);
            $(document).off(constants.EVENT_GRID_RERENDER, this.rerenderGrid);
            stopInputMethods();
            if (this.detachQuickEditHold) {
                this.detachQuickEditHold();
            }
            this.setViewPropsUnlocked();
            $.contextMenu('destroy');
            liveElementService.stop();
            vueApp = null;
        },
        mounted: async function () {
            vueApp = this;
            this.detachQuickEditHold = holdGesture.attach(this.$el, {
                selector: '.element-container',
                duration: QUICK_EDIT_HOLD_MS,
                enabled: () => !!this.metadata && !this.metadata.locked && !this.showModal && !this.quickEditElementId && !this.panelOpen && !this.choosingPhotoTarget,
                onStart: (target) => target.classList.add('gf-holding'),
                onCancel: (target) => target.classList.remove('gf-holding'),
                onDone: (target) => {
                    target.classList.remove('gf-holding');
                    this.openQuickEdit(target);
                }
            });

            let savedMetadata = await dataService.getMetadata();
            let metadata = JSON.parse(JSON.stringify(savedMetadata || new MetaData()));
            metadata.lastOpenedGridId = this.gridId;
            metadata.locked = metadata.locked === undefined ? urlParamService.isDemoMode() && dataService.getCurrentUser() === constants.LOCAL_DEMO_USERNAME : metadata.locked;
            if (metadata.locked) {
                $(document).trigger(constants.EVENT_UI_LOCKED);
            }
            metadata.fullscreen = metadata.fullscreen === undefined ? urlParamService.isDemoMode() && dataService.getCurrentUser() === constants.LOCAL_DEMO_USERNAME : metadata.fullscreen;
            metadata.fullscreen = urlParamService.isFullscreen(true) ? true : metadata.fullscreen;
            metadata.fullscreen = metadata.fullscreen && util.isFullscreen();
            metadata.locked = urlParamService.isLocked(true) ? true : metadata.locked;
            metadata.inputConfig.scanEnabled = urlParamService.isScanningEnabled() ? true : metadata.inputConfig.scanEnabled;
            metadata.inputConfig.dirEnabled = urlParamService.isDirectionEnabled() ? true : metadata.inputConfig.dirEnabled;
            metadata.inputConfig.huffEnabled = urlParamService.isHuffmanEnabled() ? true : metadata.inputConfig.huffEnabled;
            dataService.saveMetadata(metadata).then(() => {
                if (metadata.locked) {
                    this.setViewPropsLocked();
                }
            });
            this.metadata = metadata;
            this.globalGridData = await dataService.getGlobalGrid();
            let gridData = await dataService.getGrid(this.gridId, false, true);
            if (!gridData) {
                log.warn('grid not found! gridId: ' + this.gridId);
                let grids = await dataService.getGrids(false, true);
                if (grids && grids[0]) {
                    gridData = await dataService.getGrid(grids[0].id);
                } else {
                    return Router.toManageGrids();
                }
            }
            this.loadGrid(gridData);
        }
    };

    function stopInputMethods() {
        if (!vueApp) {
            return;
        }
        if (vueApp.scanner) vueApp.scanner.destroy();
        if (vueApp.hover) vueApp.hover.destroy();
        if (vueApp.clicker) vueApp.clicker.destroy();
        if (vueApp.directionInput) vueApp.directionInput.destroy();
        if (vueApp.huffmanInput) vueApp.huffmanInput.destroy();
        if (vueApp.seqInput) vueApp.seqInput.destroy();
        vueApp.inputMethodsInitialized = false;
    }

    export default vueConfig;
</script>

<style scoped>
    /* Grilo Falante: the board fills the screen; only a thin strip with the "Responsável" button below */
    .prancha {
        background: var(--g-fundo);
        font-family: var(--g-fonte);
    }

    .prancha-area {
        flex: 1 1 auto;
        min-height: 0;
        display: flex;
        position: relative;
    }

    .prancha-carregando {
        flex: 1;
        display: grid;
        place-items: center;
        color: var(--g-folha);
        font-size: 48px;
    }
    .prancha-carregando .ti { animation: prancha-girar 1s linear infinite; }
    @keyframes prancha-girar { to { transform: rotate(360deg); } }

    .prancha-vazia { align-items: center; justify-content: center; padding: var(--g-e4); }
    .prancha-vazia-cartao {
        max-width: 420px;
        text-align: center;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--g-e3);
    }
    .prancha-vazia-icone { font-size: 64px; color: var(--g-folha); } /* no mascot on the child board */
    .prancha-vazia-titulo { margin: 0; font-family: var(--g-fonte-titulo); font-size: var(--g-t-h2); color: var(--g-tinta); }
    .prancha-vazia-cartao p { margin: 0; }

    .prancha-rodape {
        flex: none;
        display: flex;
        align-items: center;
        gap: var(--g-e3);
        min-height: calc(var(--g-alvo) + 8px);
        padding: 4px var(--g-e2) calc(4px + env(safe-area-inset-bottom, 0px));
        background: var(--g-fundo);
    }
    .prancha-rodape-dica {
        display: inline-flex;
        align-items: center;
        gap: var(--g-e2);
        min-width: 0;
        color: var(--g-tinta-3);
        font-size: var(--g-t-legenda);
        padding-left: var(--g-e2);
    }
    .prancha-rodape-dica span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .prancha-rodape-dica .ti { font-size: 19.2px; flex: none; }

    /* "Foto nova": choose the button that gets the photo (in the strip, so no button is covered) */
    .prancha-escolher-foto {
        flex: 1 1 auto;
        min-width: 0;
        display: flex;
        align-items: center;
        gap: var(--g-e3);
        padding: 4px 4px 4px var(--g-e4);
        border-radius: var(--g-raio-pilula);
        background: var(--g-tinta);
        color: #fff;
        font-weight: 700;
        font-size: var(--g-t-legenda);
        animation: prancha-surgir var(--g-medio) var(--g-curva);
    }
    .prancha-escolher-foto > .ti { font-size: 22px; color: var(--g-girassol); flex: none; }
    .prancha-escolher-foto-texto { flex: 1; min-width: 0; line-height: 1.2; }
    .prancha-escolher-foto .g-btn { min-height: 40px; border-radius: var(--g-raio-pilula); flex: none; padding: 0 var(--g-e3); }
    @keyframes prancha-surgir { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }

    /* button held for the quick edit panel (adult mode) */
    #gridView >>> .element-container {
        -webkit-touch-callout: none;
        -webkit-user-select: none;
        user-select: none;
    }

    #gridView >>> .element-container.gf-holding {
        outline: 4px solid var(--g-girassol);
        outline-offset: -2px;
        transition: outline-color 1s;
    }

    /* keyboard and switch users: always see where the focus is */
    #gridView >>> .element-container:focus-visible {
        outline: none;
        box-shadow: var(--g-foco);
        z-index: 2;
    }

    @media (max-width: 480px) {
        .prancha-rodape-dica { display: none; }
    }

    @media (prefers-reduced-motion: reduce) {
        .prancha-carregando .ti, .prancha-escolher-foto { animation: none; }
    }
</style>
