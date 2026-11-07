<template>
    <gestao-modal :titulo="$t('gestaoMatrixTitulo')" icone="messages" tamanho="m" @close="$emit('close')">
        <template #abas>
            <div class="gm-abas" role="tablist">
                <button v-for="aba in abas" :key="aba.id" type="button" role="tab" class="gm-aba" :aria-selected="(currentTab === aba.id).toString()" @click="currentTab = aba.id">
                    <i :class="'ti ti-' + aba.icone" aria-hidden="true"></i>{{ $t(aba.texto) }}
                </button>
            </div>
        </template>

        <div class="matrix" role="tabpanel">
            <p v-if="initialLoading" class="gm-vazio" aria-live="polite">
                <i class="ti ti-loader-2 matrix-girando" aria-hidden="true"></i>{{ $t('gestaoMatrixCarregando') }}
            </p>
            <div v-if="!initialLoading && !loggedInUser && currentTab !== TABS.TAB_GENERAL" class="gm-vazio">
                <i class="ti ti-lock" aria-hidden="true"></i>
                <p>{{ $t('gestaoMatrixEntreAntes') }}</p>
                <button type="button" class="g-btn g-btn-principal" @click="currentTab = TABS.TAB_GENERAL"><i class="ti ti-user" aria-hidden="true"></i>{{ $t('gestaoMatrixIrConta') }}</button>
            </div>
            <configure-matrix-general v-if="!initialLoading && currentTab === TABS.TAB_GENERAL" :logged-in-user="loggedInUser" @user="loggedInUserChanged"></configure-matrix-general>
            <div v-if="!initialLoading && loggedInUser">
                <configure-matrix-messages v-if="currentTab === TABS.TAB_MESSAGES"></configure-matrix-messages>
                <configure-matrix-rooms v-if="currentTab === TABS.TAB_ROOMS"></configure-matrix-rooms>
            </div>
        </div>

        <template #rodape>
            <button type="button" class="g-btn g-btn-principal" @click="save()">{{ $t('gestaoFechar') }}</button>
        </template>
    </gestao-modal>
</template>

<script>
    import './../../../css/modal.css';
    import GestaoModal from "../gestaoModal.vue";
    import { matrixService } from '../../../js/service/matrixMessenger/matrixService';
    import ConfigureMatrixGeneral from './configure-matrix-general.vue';
    import ConfigureMatrixMessages from './configure-matrix-messages.vue';
    import ConfigureMatrixRooms from './configure-matrix-rooms.vue';

    const TAB_GENERAL = 'TAB_GENERAL';
    const TAB_ROOMS = 'TAB_ROOMS';
    const TAB_MESSAGES = 'TAB_MESSAGES';
    const TABS = {TAB_GENERAL, TAB_ROOMS, TAB_MESSAGES};

    export default {
        props: ['editElementIdParam', 'gridDataId', 'undoService', 'newPosition'],
        components: {
            ConfigureMatrixRooms,
            ConfigureMatrixMessages,
            ConfigureMatrixGeneral,
            GestaoModal
        },
        data: function () {
            return {
                TABS: TABS,
                currentTab: TAB_GENERAL,
                loggedInUser: undefined
            }
        },
        computed: {
            initialLoading() {
                return this.loggedInUser === undefined;
            },
            abas() {
                // só apresentação: rótulo e ícone de cada aba
                return [
                    {id: TAB_GENERAL, texto: 'gestaoMatrixAbaConta', icone: 'user'},
                    {id: TAB_ROOMS, texto: 'gestaoMatrixAbaSalas', icone: 'users'},
                    {id: TAB_MESSAGES, texto: 'gestaoMatrixAbaMensagens', icone: 'message-circle'}
                ];
            }
        },
        methods: {
            save() {

                this.close();
            },
            close() {
                this.$emit('close');
            },
            loggedInUserChanged(user) {
                this.loggedInUser = user;
            }
        },
        async mounted() {
            let result = await matrixService.login();
            switch (result) {
                case matrixService.LOGIN_RESULTS.SUCCESS:
                    this.loggedInUser = await matrixService.getUsername();
                    break;
                case matrixService.LOGIN_RESULTS.MISSING_DATA:
                    this.loggedInUser = null;
                    break;
                default:
                    log.warn("matrix: unknown error at login");
            }
        },
        beforeDestroy() {
        }
    }
</script>

<style scoped>
    .matrix { min-height: 240px; }
    .matrix .gm-vazio p { margin: 0 0 var(--g-e4); }
    .matrix-girando { display: inline-block; animation: matrix-girar 1s linear infinite; }
    @keyframes matrix-girar { to { transform: rotate(360deg); } }
    @media (prefers-reduced-motion: reduce) { .matrix-girando { animation: none; } }
</style>
