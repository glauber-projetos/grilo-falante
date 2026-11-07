<template>
    <div class="mb-veu" @dragenter.prevent @dragover.prevent @drop.prevent>
        <div ref="janela" class="mb-janela g-tela" :class="'mb-tipo-' + type" role="alertdialog" aria-modal="true"
             aria-labelledby="mbTitulo" :aria-describedby="message ? 'mbTexto' : null"
             @keydown.esc.stop="fecharComEsc" @keydown.tab="prenderFoco">
            <button v-if="showCloseButton" type="button" class="g-btn g-btn-leve g-btn-icone mb-fechar" @click="handleClose()" :aria-label="$t('gestaoFechar')" :title="$t('gestaoFechar')">
                <i class="ti ti-x" aria-hidden="true"></i>
            </button>

            <img v-if="type === 'success'" class="mb-mascote" src="app/img/grilo/mascote/grilo-aprovando.webp" alt="" width="112" height="112"/>
            <span v-else class="mb-icone" aria-hidden="true"><i :class="iconClass"></i></span>
            <h2 id="mbTitulo" class="mb-titulo">{{header}}</h2>

            <p v-if="message" id="mbTexto" class="mb-texto">{{message}}</p>
            <ul v-if="items && items.length > 0" class="mb-itens">
                <li v-for="item in items" :key="item"><i class="ti ti-check" aria-hidden="true"></i><span>{{item}}</span></li>
            </ul>

            <div class="mb-botoes" v-if="buttons && buttons.length > 0">
                <button v-for="(button, index) in buttons" :key="index" type="button"
                        :class="['g-btn', classeBotao(index)]"
                        @click="handleButtonClick(button)">
                    <i v-if="iconeBotao(button)" :class="iconeBotao(button)" aria-hidden="true"></i><span>{{button.label | translate}}</span>
                </button>
            </div>
        </div>
    </div>
</template>

<script>
    import { i18nService } from '../../js/service/i18nService';
    import { constants } from '../../js/util/constants';

    // Import constants for easier reference
    const MODAL_TYPE_SUCCESS = constants.MODAL_TYPE_SUCCESS;
    const MODAL_TYPE_QUESTION = constants.MODAL_TYPE_QUESTION;
    const MODAL_TYPE_WARNING = constants.MODAL_TYPE_WARNING;
    const MODAL_TYPE_INFO = constants.MODAL_TYPE_INFO;
    const BUTTONS_OK = constants.BUTTONS_OK;
    const BUTTONS_YES_NO = constants.BUTTONS_YES_NO;
    const BUTTONS_OK_CANCEL = constants.BUTTONS_OK_CANCEL;

    export default {
        props: [],
        data: function () {
            return {
                header: '',
                message: '',
                items: [],
                autoCloseDuration: 0,
                timeoutId: null,
                type: MODAL_TYPE_SUCCESS,
                buttons: [],
                showCloseButton: false,
                resolve: null,
                reject: null,
                onCloseFn: null,
                focoAnterior: null
            }
        },
        computed: {
            iconClass() {
                const icons = {
                    [MODAL_TYPE_SUCCESS]: 'ti ti-circle-check',
                    [MODAL_TYPE_QUESTION]: 'ti ti-help-circle',
                    [MODAL_TYPE_WARNING]: 'ti ti-alert-triangle',
                    [MODAL_TYPE_INFO]: 'ti ti-info-circle'
                };
                return icons[this.type] || icons[MODAL_TYPE_SUCCESS];
            }
        },
        methods: {
            show(options) {
                // Clear any existing timeout
                if (this.timeoutId) {
                    clearTimeout(this.timeoutId);
                }

                // Set basic properties
                this.type = options.type || MODAL_TYPE_SUCCESS;
                this.header = options.header ? i18nService.t(options.header) : this.getDefaultHeader();
                this.message = options.message || '';
                this.items = options.items || [];
                this.onCloseFn = options.onClose || null;

                // Handle buttons
                this.buttons = this.processButtons(options);

                // Handle auto-close
                this.autoCloseDuration = options.autoCloseDuration !== undefined ? options.autoCloseDuration : 0;

                // Show close button by default
                this.showCloseButton = options.showCloseButton !== undefined ? options.showCloseButton : true;

                // Grilo Falante: o componente fica sempre montado (v-show); leva o foco para dentro da mensagem
                if (!this.focoAnterior) {
                    this.focoAnterior = document.activeElement;
                }
                this.$nextTick(() => this.focarBotaoPrincipal());

                // Return a promise for async usage (e.g., confirm dialogs)
                return new Promise((resolve, reject) => {
                    this.resolve = resolve;
                    this.reject = reject;

                    if (this.autoCloseDuration > 0) {
                        this.timeoutId = setTimeout(() => {
                            this.handleClose(true);
                        }, this.autoCloseDuration);
                    }
                });
            },
            processButtons(options) {
                // If custom buttons provided, use them
                if (options.buttons && Array.isArray(options.buttons)) {
                    return options.buttons;
                }

                // If buttonPreset provided, use preset
                if (options.buttonPreset) {
                    return this.getButtonPreset(options.buttonPreset);
                }

                // If type is question/warning, default to Yes/No
                if (this.type === MODAL_TYPE_QUESTION || this.type === MODAL_TYPE_WARNING) {
                    return this.getButtonPreset(BUTTONS_YES_NO);
                }

                // Otherwise, no buttons
                return [];
            },
            getButtonPreset(preset) {
                const presets = {
                    [BUTTONS_OK]: [
                        { label: 'ok', value: true, icon: 'ti ti-check' }
                    ],
                    [BUTTONS_YES_NO]: [
                        { label: 'no', value: false, icon: 'ti ti-x' },
                        { label: 'yes', value: true, icon: 'ti ti-check' }
                    ],
                    [BUTTONS_OK_CANCEL]: [
                        { label: 'cancel', value: false, icon: 'ti ti-x' },
                        { label: 'ok', value: true, icon: 'ti ti-check' }
                    ]
                };
                return presets[preset] || presets[BUTTONS_OK];
            },
            getDefaultHeader() {
                return i18nService.t(this.type);
            },
            handleButtonClick(button) {
                // Resolve promise with button value
                if (this.resolve) {
                    this.resolve(button.value);
                }

                // Call onClose callback if provided
                if (this.onCloseFn) {
                    this.onCloseFn();
                }

                // Close modal
                this.$emit('close');
                this.cleanup();
                this.devolverFoco();
            },
            handleClose(autoClose = false) {
                // For auto-close or manual close
                if (this.resolve) {
                    this.resolve(autoClose);
                }

                // Call onClose callback if provided
                if (this.onCloseFn) {
                    this.onCloseFn();
                }

                this.$emit('close');
                this.cleanup();
                this.devolverFoco();
            },
            cleanup() {
                if (this.timeoutId) {
                    clearTimeout(this.timeoutId);
                    this.timeoutId = null;
                }
                this.resolve = null;
                this.reject = null;
                this.onCloseFn = null;
            },

            // ---- Grilo Falante: só apresentação e teclado ----
            classeBotao(index) {
                if (index !== this.buttons.length - 1) {
                    return '';
                }
                if (this.type === MODAL_TYPE_WARNING && this.buttons.length > 1) {
                    return 'g-btn-perigo';
                }
                return 'g-btn-principal';
            },
            iconeBotao(button) {
                let icone = button && button.icon ? String(button.icon) : '';
                if (!icone) {
                    return '';
                }
                // só ícones Tabler ("ti ti-..."); os botões padrão já usam Tabler
                return icone.indexOf("ti-") !== -1 ? icone : "";
            },
            fecharComEsc() {
                if (this.showCloseButton) {
                    this.handleClose();
                }
            },
            focaveis() {
                if (!this.$refs.janela) return [];
                return Array.from(this.$refs.janela.querySelectorAll('button:not([disabled]), [href]')).filter(el => el.offsetParent !== null);
            },
            focarBotaoPrincipal() {
                let lista = this.focaveis();
                if (lista.length > 0) {
                    lista[lista.length - 1].focus();
                }
            },
            prenderFoco(event) {
                let lista = this.focaveis();
                if (lista.length === 0) return;
                let primeiro = lista[0];
                let ultimo = lista[lista.length - 1];
                if (event.shiftKey && document.activeElement === primeiro) {
                    ultimo.focus();
                    event.preventDefault();
                } else if (!event.shiftKey && document.activeElement === ultimo) {
                    primeiro.focus();
                    event.preventDefault();
                }
            },
            devolverFoco() {
                let alvo = this.focoAnterior;
                this.focoAnterior = null;
                if (alvo && alvo.focus && document.body.contains(alvo)) {
                    try { alvo.focus(); } catch (e) {}
                }
            }
        },
        mounted() {
        },
        beforeDestroy() {
            this.cleanup();
        }
    }
</script>

<style scoped>
    /* Grilo Falante: mensagem curta (sucesso, pergunta, aviso, informação). Fica acima dos modais de gestão (9998). */
    .mb-veu {
        position: fixed; inset: 0; z-index: 10001;
        background: rgba(20, 32, 15, 0.45);
        display: flex; align-items: center; justify-content: center;
        padding: var(--g-e4);
        animation: g-aparecer var(--g-medio) var(--g-curva);
    }
    .mb-janela.g-tela {
        position: relative;
        min-height: 0;
        width: 100%;
        max-width: 520px;
        max-height: calc(100vh - 2 * var(--g-e4));
        max-height: calc(100dvh - 2 * var(--g-e4));
        overflow-y: auto;
        display: flex; flex-direction: column; align-items: center;
        padding: var(--g-e6) var(--g-e5) var(--g-e5);
        background: var(--g-superficie);
        border-radius: var(--g-raio-g);
        box-shadow: var(--g-sombra);
        text-align: center;
    }
    .mb-fechar { position: absolute; top: var(--g-e2); right: var(--g-e2); color: var(--g-tinta-2); }
    .mb-icone {
        width: 72px; height: 72px; flex: none; border-radius: 50%;
        display: grid; place-items: center; margin-bottom: var(--g-e3);
        background: var(--g-folha-clara); color: var(--g-folha-escura);
        font-size: 40px;
    }
    .mb-mascote { width: 112px; height: 112px; object-fit: contain; margin-bottom: var(--g-e2); }
    .mb-tipo-question .mb-icone, .mb-tipo-info .mb-icone { background: var(--g-ceu); color: var(--g-ceu-escuro); }
    .mb-tipo-warning .mb-icone { background: var(--g-girassol-claro); color: #4a3b00; }
    .mb-janela .mb-titulo { font-size: var(--g-t-h3); margin: 0 0 var(--g-e2); padding: 0 var(--g-e5); overflow-wrap: anywhere; }
    .mb-texto { font-size: var(--g-t-grande); margin: 0 0 var(--g-e2); color: var(--g-tinta); overflow-wrap: anywhere; white-space: pre-line; }
    .mb-itens { list-style: none; margin: var(--g-e2) 0 0; padding: 0; display: flex; flex-direction: column; gap: var(--g-e1); text-align: left; }
    .mb-itens li { display: flex; align-items: center; gap: var(--g-e2); margin: 0; font-size: var(--g-t-corpo); }
    .mb-itens .ti { color: var(--g-folha); font-size: 14px; flex: none; }
    .mb-botoes {
        display: flex; flex-wrap: wrap; justify-content: center; gap: var(--g-e3);
        width: 100%; margin-top: var(--g-e5);
    }
    .mb-botoes .g-btn { flex: 1 1 140px; max-width: 240px; }
    .mb-janela :focus-visible { outline: none; box-shadow: var(--g-foco); }
    @media (max-width: 600px) {
        .mb-janela.g-tela { padding: var(--g-e6) var(--g-e4) var(--g-e4); }
        .mb-botoes .g-btn { max-width: none; }
    }
</style>
