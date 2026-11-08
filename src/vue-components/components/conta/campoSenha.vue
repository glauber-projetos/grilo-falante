<template>
    <div class="g-campo ct-campo" :class="{'g-campo-erro': erro}">
        <label :for="id">{{ rotulo }}</label>
        <div class="ct-senha">
            <input :id="id" ref="input" :type="ver ? 'text' : 'password'" :value="value" :autocomplete="autocomplete"
                   autocapitalize="off" spellcheck="false" :aria-invalid="erro ? 'true' : 'false'" :aria-describedby="descritores"
                   @input="$emit('input', $event.target.value)"/>
            <button type="button" class="g-btn g-btn-leve g-btn-icone ct-olho" :aria-pressed="ver ? 'true' : 'false'"
                    :aria-label="ver ? 'Esconder senha' : 'Mostrar senha'" @click="ver = !ver">
                <i :class="['ti', ver ? 'ti-eye-off' : 'ti-eye']" aria-hidden="true"></i>
            </button>
        </div>
        <div v-if="medidor" class="ct-medidor" :data-n="forca" aria-hidden="true"><i></i><i></i><i></i></div>
        <p v-if="textoDica" :id="id + '-dica'" class="g-dica ct-dica">{{ textoDica }}</p>
        <p v-if="erro" :id="id + '-erro'" class="ct-msg-erro" role="alert"><i class="ti ti-alert-triangle" aria-hidden="true"></i> {{ erro }}</p>
    </div>
</template>

<script>
    /**
     * Grilo Falante: password field with "show password" and, for new passwords, a simple strength meter.
     * v-model; props: id, rotulo, dica, erro, medidor, autocomplete
     */
    export default {
        props: {
            id: { type: String, required: true },
            rotulo: { type: String, required: true },
            value: { type: String, default: '' },
            dica: { type: String, default: '' },
            erro: { type: String, default: '' },
            medidor: { type: Boolean, default: false },
            autocomplete: { type: String, default: 'new-password' }
        },
        data() {
            return { ver: false };
        },
        computed: {
            forca() {
                let v = this.value || '';
                if (!v.length) return 0;
                if (v.length < 8) return 1;
                return /\d/.test(v) && /[a-zA-ZÀ-ÿ]/.test(v) && v.length >= 10 ? 3 : 2;
            },
            textoDica() {
                if (!this.medidor) {
                    return this.dica;
                }
                let v = this.value || '';
                switch (this.forca) {
                    case 0: return this.dica || 'Pelo menos 8 letras ou números.';
                    case 1: return 8 - v.length === 1 ? 'Curta demais: falta 1.' : 'Curta demais: faltam ' + (8 - v.length) + '.';
                    case 2: return 'Serve. Misturar letras e números deixa mais forte.';
                    default: return 'Boa senha.';
                }
            },
            descritores() {
                return [this.textoDica ? this.id + '-dica' : '', this.erro ? this.id + '-erro' : ''].filter(Boolean).join(' ') || null;
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
