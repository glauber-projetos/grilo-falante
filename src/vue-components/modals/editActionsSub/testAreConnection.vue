<template>
    <div class="g-campo">
        <label for="inputAREURI">{{ $t('gestaoAcaoAreEndereco') }}</label>
        <div class="gm-campo-linha ta-linha">
            <input id="inputAREURI" type="text" spellcheck="false" v-model="areURL" @change="fixAreUrl()"/>
            <button type="button" class="g-btn" @click="testAREUrl()"><i class="ti ti-plug" aria-hidden="true"></i><span>{{ $t('gestaoAcaoTestarConexao') }}</span></button>
        </div>
        <span class="ta-estado" role="status" aria-live="polite">
            <span v-show="areConnected === undefined"><i class="ti ti-loader-2 ta-girar" aria-hidden="true"></i> {{ $t('gestaoAcaoTestando') }}</span>
            <span v-show="areConnected" class="ta-ok"><i class="ti ti-circle-check" aria-hidden="true"></i> {{ $t('urlIsValid') }}</span>
            <span v-show="areConnected === false" class="g-erro"><i class="ti ti-circle-x" aria-hidden="true"></i> {{ $t('urlIsInvalid') }}</span>
        </span>
    </div>
</template>

<script>
    import {areService} from './../../../js/service/areService'
    import {i18nService} from "../../../js/service/i18nService";

    export default {
        props: ["value"],
        data: function () {
            return {
                areConnected: null,
                areURL: null
            }
        },
        methods: {
            testAREUrl() {
                let thiz = this;
                this.areURL = areService.getRestURL(this.areURL);
                this.updateValue();
                this.areConnected = undefined;
                areService.getModelName(this.areURL).then(() => {
                    thiz.areConnected = true;
                }).catch(() => {
                    thiz.areConnected = false;
                });
            },
            fixAreUrl() {
                this.areURL = areService.getRestURL(this.areURL);
                this.updateValue();
            },
            updateValue() {
                this.$emit('input', this.areURL);
            }
        },
        mounted () {
            this.areURL = this.value || areService.getRestURL();
            this.updateValue();
        }
    }
</script>

<style scoped>
.ta-linha {
    flex-wrap: wrap;
}
.ta-linha > input {
    min-width: 200px;
}
.ta-estado {
    font-size: var(--g-t-legenda);
    font-weight: 700;
}
.ta-ok {
    color: var(--g-folha-escura);
}
.ta-girar {
    display: inline-block;
    animation: ta-girar 1s linear infinite;
}
@keyframes ta-girar {
    to { transform: rotate(360deg); }
}
@media (prefers-reduced-motion: reduce) {
    .ta-girar { animation: none; }
}
</style>
