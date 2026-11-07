<template>
    <div class="g-campo aj-deslizar" :class="{ 'aj-desligado': disabled }">
        <div class="aj-deslizar-topo">
            <label :for="id">{{ label }}</label>
            <span class="g-pilula" aria-hidden="true">{{ textoValor }}</span>
        </div>
        <input :id="id" type="range" :min="min" :max="max" :step="step" :value="valorNumero" :disabled="disabled"
               :aria-valuetext="textoValor" @input="mudou($event.target.value)"/>
        <div v-if="rotuloMin || rotuloMax" class="aj-deslizar-pontas g-dica" aria-hidden="true">
            <span>{{ rotuloMin }}</span><span>{{ rotuloMax }}</span>
        </div>
        <p v-if="dica" class="g-dica">{{ dica }}</p>
    </div>
</template>

<script>
    /**
     * Grilo Falante: slider with the label on top of the field (Ajustes).
     * Emits "input" and "change" with a number, like the old sliderInput.
     */
    export default {
        props: {
            id: { type: String, required: true },
            label: { type: String, required: true },
            value: { type: [Number, String], default: undefined },
            min: { type: [Number, String], default: 0 },
            max: { type: [Number, String], default: 100 },
            step: { type: [Number, String], default: 1 },
            decimals: { type: [Number, String], default: 0 },
            displayFactor: { type: [Number, String], default: 1 },
            unit: { type: String, default: '' },
            formatar: { type: Function, default: null },
            rotuloMin: { type: String, default: '' },
            rotuloMax: { type: String, default: '' },
            dica: { type: String, default: '' },
            disabled: { type: Boolean, default: false },
            padrao: { type: [Number, String], default: undefined }
        },
        computed: {
            valorNumero() {
                if (this.value === undefined || this.value === null || this.value === '') {
                    return this.padrao !== undefined ? this.padrao : this.min;
                }
                return this.value;
            },
            textoValor() {
                let valor = parseFloat(this.valorNumero);
                if (this.formatar) {
                    return this.formatar(valor);
                }
                let mostrado = valor * parseFloat(this.displayFactor);
                let texto = parseInt(this.decimals) ? mostrado.toFixed(parseInt(this.decimals)) : Math.round(mostrado).toString();
                if (this.$i18n && this.$i18n.locale && this.$i18n.locale.startsWith('pt')) {
                    texto = texto.replace('.', ',');
                }
                return this.unit ? `${texto} ${this.unit}` : texto;
            }
        },
        methods: {
            mudou(valor) {
                let numero = parseFloat(valor);
                this.$emit('input', numero);
                this.$emit('change', numero);
            }
        }
    };
</script>

<style scoped>
    .aj-deslizar-topo {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--g-e3);
        flex-wrap: wrap;
    }
    .aj-deslizar-topo label {
        font-weight: 700;
        margin: 0;
    }
    input[type="range"] {
        width: 100%;
        min-height: var(--g-alvo);
        margin: 0;
        padding: 0;
        border: none;
        background: transparent;
        accent-color: var(--g-folha);
        cursor: pointer;
    }
    input[type="range"]:focus-visible {
        outline: none;
        box-shadow: var(--g-foco);
        border-radius: var(--g-raio-p);
    }
    .aj-deslizar-pontas {
        display: flex;
        justify-content: space-between;
        margin-top: -6px;
    }
    .aj-desligado input[type="range"] {
        opacity: 0.5;
        cursor: not-allowed;
    }
</style>
