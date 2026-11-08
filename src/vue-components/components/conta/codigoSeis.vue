<template>
    <div class="ct-codigo" :class="{erro: erro}" role="group" aria-label="Código de 6 números">
        <template v-for="(d, i) in digitos">
            <span v-if="i === 3" :key="'meio'" class="ct-codigo-meio" aria-hidden="true"></span>
            <input :key="i" ref="caixa" type="text" inputmode="numeric" pattern="[0-9]*" :autocomplete="i === 0 ? 'one-time-code' : 'off'"
                   :aria-label="'Número ' + (i + 1)" :value="d" :disabled="desligado" :aria-invalid="erro ? 'true' : 'false'"
                   @input="aoDigitar(i, $event)" @keydown="aoTeclar(i, $event)" @paste="aoColar(i, $event)" @focus="$event.target.select()"/>
        </template>
    </div>
</template>

<script>
    /**
     * Grilo Falante: 6 boxes for the code from the e-mail. Goes to the next box by itself, accepts pasting
     * the whole code (also "482 913") in any box and the code offered by the keyboard (autofill).
     * Emits "completo" with the 6 numbers as soon as all boxes are filled.
     */
    export default {
        props: {
            erro: { type: Boolean, default: false },
            desligado: { type: Boolean, default: false }
        },
        data() {
            return { digitos: ['', '', '', '', '', ''] };
        },
        methods: {
            caixa(i) {
                return this.$refs.caixa ? this.$refs.caixa[i] : null;
            },
            focar(i = 0) {
                this.$nextTick(() => {
                    let c = this.caixa(i);
                    if (c) {
                        c.focus();
                    }
                });
            },
            limpar() {
                this.digitos = ['', '', '', '', '', ''];
                this.focar(0);
            },
            preencher(inicio, numeros) {
                let novos = this.digitos.slice();
                numeros.split('').forEach((n, k) => {
                    if (inicio + k < 6) {
                        novos[inicio + k] = n;
                    }
                });
                this.digitos = novos;
                this.$forceUpdate();
                let vazio = this.digitos.findIndex((x) => !x);
                if (vazio < 0) {
                    this.conferir();
                } else {
                    this.focar(Math.min(vazio, 5));
                }
            },
            aoDigitar(i, ev) {
                let numeros = String(ev.target.value || '').replace(/\D/g, '');
                if (numeros.length > 1) {
                    // the keyboard offered the code, or the box got more than one number
                    ev.target.value = '';
                    return this.preencher(numeros.length >= 6 ? 0 : i, numeros.slice(0, 6));
                }
                let novos = this.digitos.slice();
                novos[i] = numeros;
                this.digitos = novos;
                ev.target.value = numeros;
                if (numeros && i < 5) {
                    this.focar(i + 1);
                }
                if (this.digitos.every((x) => /^\d$/.test(x))) {
                    this.conferir();
                }
            },
            aoTeclar(i, ev) {
                if (ev.key === 'Backspace' && !this.digitos[i] && i > 0) {
                    ev.preventDefault();
                    let novos = this.digitos.slice();
                    novos[i - 1] = '';
                    this.digitos = novos;
                    this.focar(i - 1);
                } else if (ev.key === 'ArrowLeft' && i > 0) {
                    this.focar(i - 1);
                } else if (ev.key === 'ArrowRight' && i < 5) {
                    this.focar(i + 1);
                }
            },
            aoColar(i, ev) {
                let texto = (ev.clipboardData || window.clipboardData).getData('text') || '';
                let numeros = texto.replace(/\D/g, '').slice(0, 6);
                if (!numeros) {
                    return;
                }
                ev.preventDefault();
                this.preencher(numeros.length === 6 ? 0 : i, numeros);
            },
            conferir() {
                let codigo = this.digitos.join('');
                if (/^\d{6}$/.test(codigo)) {
                    let c = document.activeElement;
                    if (c && this.$el.contains(c)) {
                        c.blur();
                    }
                    this.$emit('completo', codigo);
                }
            }
        }
    };
</script>
