import $ from '../externals/jquery.js';
import Vue from 'vue';
import VueI18n from 'vue-i18n';
import { i18nService } from '../service/i18nService';
import { constants } from '../util/constants';
import { util } from '../util/util';
import { inputEventHandler } from '../input/inputEventHandler';
import { dataService } from '../service/data/dataService';
import { databaseService } from '../service/data/databaseService';
import { localStorageService } from '../service/data/localStorageService';
import { helpService } from '../service/helpService';
import { Router } from '../router';
import NotificationBar from '../../vue-components/components/notificationBar.vue';
import ProgressBarModal from '../../vue-components/modals/progressBarModal.vue';
import SearchModal from "../../vue-components/modals/searchModal.vue";
import PhraseHistoryModal from "../../vue-components/modals/phraseHistoryModal.vue";
import MessageBox from "../../vue-components/modals/messageBox.vue";
import { systemActionService } from '../service/systemActionService';
import '../service/voiceProfileService'; // applies the voice settings saved in the child's profile on this device

let MainVue = {};
let app = null;

let modalTypes = {
    MODAL_SEARCH: 'MODAL_SEARCH',
    MODAL_PHRASES: 'MODAL_PHRASES',
    MODAL_PROGRESSBAR: 'MODAL_PROGRESSBAR',
    MODAL_MESSAGEBOX: 'MODAL_MESSAGEBOX'
};

MainVue.setViewComponent = function (component, properties) {
    app.setComponent(component, properties);
};

/**
 * Grilo Falante: the old sidebar of the original app was removed (navigation is the adult home "#inicio" and the
 * top bar gTopo.vue). These two functions stay so that older code that still calls them keeps working.
 */
MainVue.isSidebarOpen = function () {
    return false;
};

MainVue.restoreSidebar = function () {};

/**
 * Name, initial, photo and color of the child of the current profile, shown in the adult home and in the top bar.
 * Reads the summary the entry screens save in localStorage "GRILO_PERFIS" ({usuario: {nome, foto}}), with the same
 * rules as src/js/service/perfilNomes.js (display name, initial, fixed color per user), so the face is the same as in
 * "Quem vai falar hoje?".
 * @param username optional, defaults to the current user
 * @return {{usuario: string, nome: string, inicial: string, foto: string|null, cor: string}}
 */
MainVue.getPerfil = function (username) {
    return getPerfil(username || databaseService.getCurrentUsedDatabase());
};

/**
 * trigger this jQuery event on document after changing the name or photo of the profile, so the top bar and the
 * adult home update: $(document).trigger(MainVue.EVENT_PERFIL_ALTERADO)
 */
MainVue.EVENT_PERFIL_ALTERADO = 'grilo-perfil-alterado';

// same lists as in perfilNomes.js
const USUARIOS_SEM_NOME = ['default-user', 'default', 'local', 'user', 'usuario', 'teste-automatico', constants.LOCAL_DEMO_USERNAME];
const CORES_AVATAR = ['#3f8a2a', '#c94a2c', '#12406e', '#3e2a85', '#7a3410', '#2f6b1f', '#9c3d6b', '#0f5c5a'];

function getPerfil(username) {
    let perfil = { usuario: username || '', nome: '', inicial: '', foto: null, cor: CORES_AVATAR[0] };
    if (!username) {
        return perfil;
    }
    let salvo = {};
    try {
        let todos = JSON.parse(window.localStorage.getItem('GRILO_PERFIS') || '{}') || {};
        salvo = todos[username] || {};
    } catch (e) {
        salvo = {};
    }
    let nome = salvo.nome && String(salvo.nome).trim();
    if (!nome && !USUARIOS_SEM_NOME.includes(username)) {
        nome = String(username).replace(/[-_]+\d*$/, '').replace(/[-_]+/g, ' ').trim()
            .toLocaleLowerCase('pt-BR')
            .replace(/(^|\s)(\S)/g, (m, espaco, letra) => espaco + letra.toLocaleUpperCase('pt-BR'));
    }
    perfil.nome = nome || '';
    perfil.inicial = perfil.nome ? perfil.nome.charAt(0).toLocaleUpperCase('pt-BR') : '';
    perfil.foto = typeof salvo.foto === 'string' && salvo.foto ? salvo.foto : null;
    let h = 0;
    for (let i = 0; i < username.length; i++) {
        h = (h * 31 + username.charCodeAt(i)) >>> 0;
    }
    perfil.cor = CORES_AVATAR[h % CORES_AVATAR.length];
    return perfil;
}

MainVue.setTooltip = function (html, options) {
    if (!app) {
        return;
    }
    if (app.uiLocked) {
        app.hiddenPopupData = {
            html: html,
            options: options
        };
        return;
    }
    return app.$refs.notificationBar.setTooltip(html, options);
};

MainVue.clearTooltip = function () {
    if (!app) {
        return;
    }
    app.hiddenPopupData = null;
    app.$refs.notificationBar.clearTooltip();
};

MainVue.setTooltipAfterNavigation = function(html, options) {
    $(document).on(constants.EVENT_NAVIGATED, handler);

    function handler() {
        MainVue.setTooltip(html, options);
        $(document).off(constants.EVENT_NAVIGATED, handler);
    }
};

/**
 * Shows a progressbar with the given percentage/text. If a percentage of 100 is passed, the progressbar closes itself.
 * @param percentage
 * @param options.header
 * @param options.text
 * @param options.cancelFn (optional) a function that is called if the user closes the progressbar modal
 * @param options.closable if true, the user can close the modal
 * @returns Promise that resolves when progress is set (and modal closes if percentage is 100)
 */
MainVue.showProgressBar = function (percentage, options) {
    if (!app) {
        return Promise.resolve();
    }
    app.showModal = modalTypes.MODAL_PROGRESSBAR;
    return app.$refs.progressBar.setProgress(percentage, options);
};

/**
 * show search modal
 * @param options.searchText text to be pre-filled in search bar
 * @param options.searchCollectedText use text from collect element to be pre-filled in search bar, if true
 */
/**
 * show modal with favorite and recently spoken sentences
 */
MainVue.showPhraseHistoryModal = function () {
    if (app) {
        app.showModal = modalTypes.MODAL_PHRASES;
    }
};

MainVue.showSearchModal = function (options) {
    app.showModal = modalTypes.MODAL_SEARCH;
    app.modalOptions = options || {};
};

/**
 * show message box (generic method for all message types)
 * @param options.header header text (will be translated)
 * @param options.message message text
 * @param options.items array of items to show as list
 * @param options.autoCloseDuration duration in ms before auto-close (default: 0 = no auto-close)
 * @param options.type modal type: 'success', 'question', 'warning', 'info' (default: 'success')
 * @param options.buttonPreset button preset: 'ok', 'yesno', 'okcancel'
 * @param options.buttons custom buttons array
 * @param options.showCloseButton show X close button (default: true)
 * @param options.onClose callback function called when modal closes
 * @returns Promise that resolves with button value
 */
MainVue.showMessageBox = function (options) {
    if (!app) {
        return Promise.resolve(false);
    }
    app.showModal = modalTypes.MODAL_MESSAGEBOX;
    return new Promise((resolve) => {
        app.$nextTick(() => {
            if (app.$refs.messageBox) {
                app.$refs.messageBox.show(options || {}).then(resolve);
            } else {
                resolve(false);
            }
        });
    });
};

/**
 * show confirmation dialog (replaces native confirm())
 * @param message confirmation message
 * @param options.header header text
 * @param options.buttonPreset button preset: 'yesno' (default), 'okcancel', 'ok'
 * @returns Promise that resolves to true if confirmed, false if cancelled
 */
MainVue.showConfirmBox = function (message, options = {}) {
    return MainVue.showMessageBox({
        type: constants.MODAL_TYPE_QUESTION,
        header: options.header,
        message: message,
        buttonPreset: options.buttonPreset || constants.BUTTONS_YES_NO,
        showCloseButton: options.showCloseButton !== undefined ? options.showCloseButton : true
    });
};

MainVue.searchModalOpened = function() {
    return app.showModal === modalTypes.MODAL_SEARCH;
};

MainVue.init = function () {
    Vue.use(VueI18n);
    return i18nService.getVueI18n().then((i18n) => {
        app = new Vue({
            i18n: i18n,
            el: '#app',
            components: { NotificationBar, ProgressBarModal, SearchModal, MessageBox, PhraseHistoryModal },
            data() {
                return {
                    component: null,
                    properties: null,
                    componentKey: 0,
                    currentUser: databaseService.getCurrentUsedDatabase(),
                    perfil: getPerfil(databaseService.getCurrentUsedDatabase()),
                    isLocalUser: localStorageService.isSavedLocalUser(databaseService.getCurrentUsedDatabase()),
                    syncState: dataService.getSyncState(),
                    constants: constants,
                    tooltipHTML: null,
                    actionLink: null,
                    Router: Router,
                    uiLocked: false,
                    hiddenPopupData: null,
                    modalTypes: modalTypes,
                    showModal: null,
                    modalOptions: {}
                };
            },
            methods: {
                setComponent(component, properties) {
                    this.component = component;
                    this.properties = properties;
                    this.componentKey++; //forces to update the view, even with same component (e.g. grid view, other page)
                },
                openHelp() {
                    helpService.openHelp();
                },
                toMain() {
                    Router.toMain();
                }
            },
            mounted() {
                let thiz = this;
                let updateUser = () => {
                    thiz.currentUser = databaseService.getCurrentUsedDatabase();
                    thiz.isLocalUser = localStorageService.isSavedLocalUser(thiz.currentUser);
                    thiz.perfil = getPerfil(thiz.currentUser);
                };
                $(document).on(constants.EVENT_DB_INITIALIZED, updateUser);
                $(document).on(constants.EVENT_DB_CLOSED, updateUser);
                $(document).on(MainVue.EVENT_PERFIL_ALTERADO, updateUser);
                $(document).on(constants.EVENT_DB_SYNC_STATE_CHANGE, (event, syncState) => {
                    thiz.syncState = syncState;
                });
                $(document).on(constants.EVENT_GRID_IMAGES_CACHING, () => {
                    thiz.syncState = constants.DB_SYNC_STATE_SYNCINC;
                });
                $(document).on(constants.EVENT_GRID_IMAGES_CACHED, () => {
                    thiz.syncState = dataService.getSyncState();
                });
                $(document).on(constants.EVENT_UI_UNLOCKED, () => {
                    this.uiLocked = false;
                    if (this.hiddenPopupData) {
                        MainVue.setTooltip(this.hiddenPopupData.html, this.hiddenPopupData.options);
                        this.hiddenPopupData = null;
                    }
                });
                $(document).on(constants.EVENT_UI_LOCKED, () => {
                    this.uiLocked = true;
                    MainVue.clearTooltip();
                });
                thiz.syncState = dataService.getSyncState();
                window.addEventListener('resize', () => {
                    util.debounce(
                        function () {
                            $(document).trigger(constants.EVENT_GRID_RESIZE);
                        },
                        300,
                        constants.EVENT_GRID_RESIZE
                    );
                });
                inputEventHandler.global
                    .onSwipedDownFromTop(() => {
                        // when the UI is locked ("child mode"), an accidental swipe of the hand
                        // must not leave fullscreen. Adults can still use the system back gesture or Esc.
                        if (util.isUILocked()) {
                            return;
                        }
                        systemActionService.exitFullscreen();
                    })
                    .onEscape(systemActionService.exitFullscreen)
                    .onExitFullscreen(systemActionService.exitFullscreen);
                inputEventHandler.global.startListening();
                $(document).on(constants.EVENT_SHOW_PHRASE_HISTORY, MainVue.showPhraseHistoryModal);
            }
        });
        return Promise.resolve();
    });
};

export { MainVue };
