<template>
    <div class="senha-raiz">
        <div class="g-veu" @click="$emit('close')"></div>
        <div class="senha-cartao" role="dialog" aria-modal="true" aria-labelledby="senhaTitulo" @keydown.esc.stop="$emit('close')">
            <div class="senha-topo">
                <i class="ti ti-lock senha-icone" aria-hidden="true"></i>
                <h2 id="senhaTitulo" class="senha-titulo">{{ $t('pranchaSenhaTitulo') }}</h2>
                <button type="button" class="g-btn g-btn-icone g-btn-leve" @click="$emit('close')" :aria-label="$t('close')" :title="$t('close')">
                    <i class="ti ti-x" aria-hidden="true"></i>
                </button>
            </div>

            <div class="g-campo" :class="{'g-campo-erro': wrong}">
                <label for="senhaCampo">{{ $t('pranchaSenhaRotulo') }}</label>
                <input id="senhaCampo" ref="campo" type="password" inputmode="numeric" autocomplete="off" pattern="[0-9]*"
                       :maxlength="maxLength" :value="inputPasscode" @input="onInput($event.target.value)"/>
                <span v-if="wrong" class="g-erro" role="alert">{{ $t('pranchaSenhaErrada') }}</span>
                <span v-else class="g-dica">{{ $t('pranchaSenhaDica') }}</span>
            </div>

            <div class="senha-teclado">
                <button v-for="i in [1,2,3,4,5,6,7,8,9]" :key="i" type="button" class="g-btn senha-tecla" @click="inputDigit(i)">{{ i }}</button>
                <button type="button" class="g-btn senha-tecla senha-tecla-leve" @click="removeDigit()" :aria-label="$t('pranchaApagar')" :title="$t('pranchaApagar')">
                    <i class="ti ti-backspace" aria-hidden="true"></i>
                </button>
                <button type="button" class="g-btn senha-tecla" @click="inputDigit(0)">0</button>
                <span aria-hidden="true"></span>
            </div>
        </div>
    </div>
</template>

<script>
/**
 * Asks the passcode of the adult (Grilo Falante) before the Painel do Responsável opens in child mode.
 * The passcode is set in the settings (unlockPasscode). The label is above the field, the field can be
 * used with the device keyboard or with the big number buttons.
 * The original master key (10 digits starting with "4", typed quickly) keeps working.
 *
 * events: unlock, close
 */
import {localStorageService} from "../../js/service/data/localStorageService";

const CLOSE_AFTER_MS = 30000;
const MASTERKEY_LENGTH = 10;

export default {
    props: [],
    data: function () {
        return {
            passcode: localStorageService.getAppSettings().unlockPasscode || '',
            inputPasscode: '',
            wrong: false,
            timeoutHandler: null,
            masterkeyPossible: true,
            timeoutMasterkeyHandler: null
        }
    },
    computed: {
        maxLength() {
            return this.masterkeyPossible ? MASTERKEY_LENGTH : Math.max(this.passcode.length, 1);
        }
    },
    methods: {
        inputDigit(digit) {
            this.onInput(this.inputPasscode + digit);
        },
        removeDigit() {
            this.onInput(this.inputPasscode.slice(0, -1));
        },
        onInput(value) {
            value = (value || '').replace(/[^0-9]/g, '');
            this.resetTimeout();
            this.inputPasscode = value;
            if (this.$refs.campo && this.$refs.campo.value !== value) {
                this.$refs.campo.value = value;
            }
            if (!value) {
                return;
            }
            this.wrong = false;
            let masterPossible = this.masterkeyPossible && value.startsWith('4');
            if (value === this.passcode) {
                this.$emit('unlock');
                this.$emit('close');
            } else if (masterPossible && value.length === MASTERKEY_LENGTH) {
                this.$emit('unlock');
                this.$emit('close');
            } else if (!masterPossible && value.length >= this.passcode.length) {
                this.wrong = true; // try again, the field is emptied
                this.inputPasscode = '';
                if (this.$refs.campo) {
                    this.$refs.campo.value = '';
                }
            }
        },
        resetTimeout(firstTime) {
            clearTimeout(this.timeoutHandler);
            clearTimeout(this.timeoutMasterkeyHandler);
            this.timeoutHandler = setTimeout(() => {
                this.$emit('close');
            }, CLOSE_AFTER_MS);
            this.timeoutMasterkeyHandler = setTimeout(() => {
                this.masterkeyPossible = false;
            }, firstTime ? 1000 : 300);
        }
    },
    mounted() {
        this.resetTimeout(true);
        this.$nextTick(() => {
            if (this.$refs.campo) {
                this.$refs.campo.focus();
            }
        });
    },
    beforeDestroy() {
        clearTimeout(this.timeoutHandler);
        clearTimeout(this.timeoutMasterkeyHandler);
    }
}
</script>

<style scoped>
.senha-raiz { position: relative; z-index: 9999; }
.senha-raiz .g-veu { z-index: 9998; }
.senha-cartao {
    position: fixed;
    z-index: 9999;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    width: min(400px, calc(100vw - 32px));
    max-height: calc(100vh - 32px);
    overflow-y: auto;
    background: var(--g-superficie);
    border-radius: var(--g-raio-g);
    box-shadow: var(--g-sombra-alta);
    padding: var(--g-e4) var(--g-e5) var(--g-e5);
    font-family: var(--g-fonte);
    color: var(--g-tinta);
    animation: g-aparecer var(--g-medio) var(--g-curva);
}
.senha-topo { display: flex; align-items: center; gap: var(--g-e3); margin-bottom: var(--g-e4); }
.senha-icone { font-size: 28.8px; color: var(--g-folha-escura); }
.senha-titulo { flex: 1; margin: 0; font-family: var(--g-fonte-titulo); font-size: var(--g-t-h3); font-weight: 700; color: var(--g-tinta); }
.senha-cartao .g-campo input { font-size: 25.6px; letter-spacing: 0.3em; text-align: center; }

.senha-teclado {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: var(--g-e2);
}
.senha-tecla {
    min-height: var(--g-alvo-g);
    padding: 0;
    font-size: 24px;
    border-radius: var(--g-raio);
}
.senha-tecla-leve { background: var(--g-superficie-2); }
.senha-tecla:focus { outline: none; }
.senha-tecla:focus-visible, .senha-cartao .g-campo input:focus-visible { box-shadow: var(--g-foco); }

@media (max-height: 560px) {
    .senha-cartao { padding: var(--g-e3) var(--g-e4); }
    .senha-topo { margin-bottom: var(--g-e2); }
    .senha-tecla { min-height: var(--g-alvo); font-size: 19.2px; }
    .senha-cartao .g-campo { margin-bottom: var(--g-e2); }
}
</style>
