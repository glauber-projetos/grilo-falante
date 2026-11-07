<template>
    <gestao-modal :titulo="$t('gestaoEdicaoTamanho')" icone="layout-grid" tamanho="p"
                  @close="$emit('close')" @keyup.ctrl.enter.native="save()">
        <div class="g-campo">
            <label for="gridRows">{{ $t('gestaoEdicaoLinhas') }}</label>
            <input id="gridRows" type="number"/>
        </div>

        <template #rodape>
            <button type="button" class="g-btn" @click="$emit('close')" :title="$t('keyboardEsc')">{{ $t('gestaoCancelar') }}</button>
            <button type="button" class="g-btn g-btn-principal" @click="save()" :title="$t('keyboardCtrlEnter')">
                <i class="ti ti-check" aria-hidden="true"></i>{{ $t('gestaoSalvar') }}
            </button>
        </template>
    </gestao-modal>
</template>

<script>
    import {i18nService} from "../../js/service/i18nService";
    import GestaoModal from './gestaoModal.vue';

    export default {
        components: {GestaoModal},
        props: ['dictData'],
        data: function () {
            return {
                inputText: "",
            }
        },
        methods: {
            save() {
                thiz.$emit('reload');
                thiz.$emit('close');
            }
        },
        mounted() {
        }
    }
</script>
