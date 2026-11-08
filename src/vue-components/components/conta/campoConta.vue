<template>
    <div class="g-campo ct-campo" :class="{'g-campo-erro': erro}">
        <label :for="id">{{ rotulo }}</label>
        <input :id="id" ref="input" :type="tipo" :value="value" :autocomplete="autocomplete" :inputmode="tipo === 'email' ? 'email' : null"
               :autocapitalize="tipo === 'email' ? 'off' : 'words'" :spellcheck="tipo === 'email' ? 'false' : null" :maxlength="maxlength"
               :aria-invalid="erro ? 'true' : 'false'" :aria-describedby="descritores"
               @input="$emit('input', $event.target.value)"/>
        <p v-if="dica" :id="id + '-dica'" class="g-dica ct-dica">{{ dica }}</p>
        <p v-if="erro" :id="id + '-erro'" class="ct-msg-erro" role="alert"><i class="ti ti-alert-triangle" aria-hidden="true"></i> {{ erro }}</p>
    </div>
</template>

<script>
    /**
     * Grilo Falante: text or e-mail field of the account screens (label above, hint and error below).
     */
    export default {
        props: {
            id: { type: String, required: true },
            rotulo: { type: String, required: true },
            value: { type: String, default: '' },
            tipo: { type: String, default: 'text' },
            dica: { type: String, default: '' },
            erro: { type: String, default: '' },
            autocomplete: { type: String, default: 'off' },
            maxlength: { type: Number, default: 120 }
        },
        computed: {
            descritores() {
                return [this.dica ? this.id + '-dica' : '', this.erro ? this.id + '-erro' : ''].filter(Boolean).join(' ') || null;
            }
        },
        methods: {
            focar() {
                if (this.$refs.input) {
                    this.$refs.input.focus();
                }
            }
        }
    };
</script>
