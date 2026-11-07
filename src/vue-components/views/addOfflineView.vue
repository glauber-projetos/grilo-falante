<template>
    <setup-wizard-view :nova-crianca="true" @fechar="voltar()"/>
</template>

<script>
    /**
     * Grilo Falante: "#add" (perfil só neste aparelho) abre o mesmo assistente de "Nova criança" da Entrada:
     * o perfil é criado sem senha, com o nome da criança.
     */
    import { Router } from "../../js/router";
    import SetupWizardView from "../wizard/setupWizardView.vue";

    export default {
        components: { SetupWizardView },
        methods: {
            voltar() {
                Router.to('#welcome');
            }
        }
    };
</script>
