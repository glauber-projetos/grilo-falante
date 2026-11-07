<template>
    <div class="matrix-mensagens">
        <div class="matrix-sala-topo">
            <div class="g-campo">
                <label for="matrixRoom">{{ $t('gestaoMatrixSala') }}</label>
                <select id="matrixRoom" v-model="matrixRoom">
                    <option v-for="room in matrixRooms" :value="room">{{ room.name }}</option>
                </select>
            </div>
            <span v-if="matrixRoom && matrixRoom.hasEncryptionStateEvent()" class="g-pilula g-pilula-ok" :title="$t('endToEndEncrypted')"><i class="ti ti-lock" aria-hidden="true"></i>{{ $t('gestaoMatrixProtegida') }}</span>
            <span v-if="matrixRoom && !matrixRoom.hasEncryptionStateEvent()" class="g-pilula matrix-pilula-alerta" :title="$t('notEndToEndEncrypted')"><i class="ti ti-lock-open" aria-hidden="true"></i>{{ $t('gestaoMatrixNaoProtegida') }}</span>
        </div>
        <div class="matrix-conversa">
            <matrix-conversation :matrix-room-prop="matrixRoom" style="max-height: 20em; overflow-y: scroll"/>
        </div>
        <form class="matrix-envio" @submit.prevent="sendMatrixMessage">
            <div class="g-campo">
                <label for="matrixTexto" class="g-oculto-leitor">{{ $t('gestaoMatrixEscrever') }}</label>
                <input id="matrixTexto" type="text" v-model="matrixText" :placeholder="$t('gestaoMatrixEscrever')" :disabled="sendDisabled" autocomplete="off"/>
            </div>
            <button type="submit" class="g-btn g-btn-principal" :disabled="sendDisabled"><i class="ti ti-send" aria-hidden="true"></i>{{ $t('gestaoMatrixEnviar') }}</button>
        </form>
        <div class="g-aviso matrix-aviso" v-if="sendDisabled">
            <i class="ti ti-info-circle" aria-hidden="true"></i>
            <span>{{ $t('gestaoMatrixNaoEnvia') }}</span>
        </div>
    </div>
</template>

<script>
    import '../../../css/modal.css';
    import { matrixService } from '../../../js/service/matrixMessenger/matrixService';
    import MatrixConversation from '../../components/matrix-conversation.vue';

    export default {
        components: { MatrixConversation },
        props: [],
        data: function () {
            return {
                matrixText: '',
                matrixRooms: [],
                matrixRoom: null,
                e2eeSupported: undefined
            }
        },
        computed: {
            sendDisabled() {
                return this.matrixRoom && this.matrixRoom.hasEncryptionStateEvent() && !this.e2eeSupported;
            }
        },
        methods: {
            async sendMatrixMessage() {
                await matrixService.sendMessage(this.matrixRoom.roomId, this.matrixText);
                this.matrixText = "";
            }
        },
        async mounted() {
            this.matrixRooms = await matrixService.getRooms() || [];
            this.matrixRoom = this.matrixRooms[0];
            this.e2eeSupported = matrixService.isEncryptionEnabled();
        },
        beforeDestroy() {
            matrixService.onMessage(null);
        }
    }
</script>

<style scoped>
    .matrix-sala-topo { display: flex; flex-wrap: wrap; align-items: flex-end; gap: var(--g-e2) var(--g-e3); }
    .matrix-sala-topo .g-campo { flex: 1 1 240px; min-width: 0; margin-bottom: 0; }
    .matrix-sala-topo .g-pilula { margin-bottom: var(--g-e2); }
    .matrix-pilula-alerta { background: var(--g-perigo-claro); color: var(--g-perigo); }
    .matrix-conversa {
        max-height: 20em; overflow-y: auto; margin: var(--g-e4) 0;
        padding: var(--g-e3); border: 2px solid var(--g-borda); border-radius: var(--g-raio);
        background: var(--g-superficie);
    }
    .matrix-envio { display: flex; gap: var(--g-e2); align-items: stretch; margin: 0; }
    .matrix-envio .g-campo { flex: 1; min-width: 0; margin-bottom: 0; }
    .matrix-envio > .g-btn { align-self: flex-end; }
    .matrix-aviso { margin-top: var(--g-e3); }
</style>
