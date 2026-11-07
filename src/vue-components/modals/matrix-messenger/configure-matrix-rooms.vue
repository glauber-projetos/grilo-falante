<template>
    <div class="matrix-salas">
        <section class="gm-secao">
            <h3><i class="ti ti-users" aria-hidden="true"></i>{{ $t('gestaoMatrixSuasSalas') }}</h3>
            <p v-if="!rooms || rooms.length === 0" class="g-apoio">{{ $t('gestaoMatrixNenhumaSala') }}</p>
            <ul class="gm-lista" v-if="rooms && rooms.length > 0">
                <li v-for="room in rooms">
                    <div class="gm-lista-texto">
                        <span class="matrix-sala-nome">
                            <i v-if="room.hasEncryptionStateEvent()" class="ti ti-lock matrix-cadeado" :title="$t('endToEndEncrypted')" aria-hidden="true"></i>
                            <i v-if="!room.hasEncryptionStateEvent()" class="ti ti-lock-open matrix-cadeado-aberto" :title="$t('notEndToEndEncrypted')" aria-hidden="true"></i>
                            <span class="g-oculto-leitor">{{ room.hasEncryptionStateEvent() ? $t('gestaoMatrixProtegida') : $t('gestaoMatrixNaoProtegida') }}:</span>
                            <span>{{ room.name }}</span>
                        </span>
                        <div class="matrix-sala-membros"><matrix-room-description :room="room" :logged-in-user="loggedInUser" :full="true"/></div>
                    </div>
                    <button type="button" class="g-btn g-btn-leve" @click="leaveRoom(room)" :aria-label="$t('gestaoMatrixSairSala', [room.name])">
                        <i v-if="leavingRoom.roomId === room.roomId" class="ti ti-loader-2 matrix-girando" aria-hidden="true"></i>
                        <i v-if="leavingRoom.roomId !== room.roomId" class="ti ti-door-exit" aria-hidden="true"></i>
                        <span>{{ $t('gestaoMatrixSairCurto') }}</span>
                    </button>
                </li>
            </ul>
        </section>

        <form class="gm-secao" @submit.prevent="createRoom">
            <h3><i class="ti ti-plus" aria-hidden="true"></i>{{ $t('gestaoMatrixNovaSala') }}</h3>
            <div class="g-campo">
                <label for="newRoomUser">{{ $t('gestaoMatrixComQuem') }}</label>
                <input type="text" id="newRoomUser" v-model="newRoomUser" @input="checkUsername" autocomplete="off"/>
                <div aria-live="polite">
                    <p v-if="checking" class="g-dica matrix-busca">
                        <i class="ti ti-loader-2 matrix-girando" aria-hidden="true"></i>{{ $t('gestaoMatrixProcurando') }}
                    </p>
                    <p v-if="userExists === true" class="matrix-resultado matrix-ok"><i class="ti ti-check" aria-hidden="true"></i>{{ $t('gestaoMatrixAchou', [fullUsername]) }}</p>
                    <p v-if="userExists === false" class="matrix-resultado g-erro"><i class="ti ti-x" aria-hidden="true"></i>{{ $t('gestaoMatrixNaoAchou', [fullUsername]) }}</p>
                </div>
            </div>
            <div class="g-campo">
                <label for="roomName">{{ $t('gestaoMatrixNomeSala') }}</label>
                <input type="text" id="roomName" v-model="newRoomName"/>
                <span class="g-dica">{{ $t('gestaoMatrixOpcional') }}</span>
            </div>
            <label class="g-marcar" v-if="canUseEncryption">
                <input type="checkbox" id="useEncryption" v-model="newRoomEncrypted"/>
                <span>{{ $t('gestaoMatrixUsarCripto') }}</span>
            </label>
            <div class="matrix-acoes">
                <button type="submit" class="g-btn g-btn-principal" :disabled="!!createRoomDisabled">
                    <i v-if="createRoomState === CREATE_ROOM_STATES.LOADING" class="ti ti-loader-2 matrix-girando" aria-hidden="true"></i>
                    <i v-if="createRoomState !== CREATE_ROOM_STATES.LOADING" class="ti ti-plus" aria-hidden="true"></i>
                    <span>{{ $t('gestaoMatrixCriar') }}</span>
                </button>
                <p v-if="createRoomState === CREATE_ROOM_STATES.ERROR" class="matrix-resultado g-erro" role="alert"><i class="ti ti-x" aria-hidden="true"></i>{{ $t('gestaoMatrixErroCriar') }}</p>
                <p v-if="createRoomState === CREATE_ROOM_STATES.SUCCESS" class="matrix-resultado matrix-ok" role="status"><i class="ti ti-check" aria-hidden="true"></i>{{ $t('gestaoMatrixCriada') }}</p>
            </div>
        </form>
    </div>
</template>

<script>
    import '../../../css/modal.css';
    import { matrixService } from '../../../js/service/matrixMessenger/matrixService';
    import { util } from '../../../js/util/util';
    import { i18nService } from '../../../js/service/i18nService';
    import MatrixRoomDescription from '../../components/matrix-room-description.vue';

    const CREATE_ROOM_STATES = {
        INITIAL: "INITIAL",
        LOADING: "LOADING",
        SUCCESS: "SUCCESS",
        ERROR: "ERROR",
    };

    export default {
        components: { MatrixRoomDescription },
        props: [],
        data: function () {
            return {
                rooms: [],
                loggedInUserFull: "",
                loggedInUser: "",
                userExists: undefined,
                checking: false,
                fullUsername: "",
                newRoomUser: "",
                newRoomName: "",
                canUseEncryption: undefined,
                newRoomEncrypted: undefined,
                CREATE_ROOM_STATES: CREATE_ROOM_STATES,
                createRoomState: CREATE_ROOM_STATES.INITIAL,
                leavingRoom: {}
            }
        },
        computed: {
            createRoomDisabled() {
                return !this.userExists || this.fullUsername === this.loggedInUserFull || this.rooms.find(r => r.name === this.newRoomName);
            }
        },
        methods: {
            async checkUsername() {
                this.userExists = undefined;
                this.createRoomState = CREATE_ROOM_STATES.INITIAL;
                if (!this.newRoomUser) {
                    this.checking = false;
                    util.clearDebounce("MATRIX_CHECK_USER");
                    return;
                }
                this.checking = true;
                util.debounce(async () => {
                    this.fullUsername = matrixService.getFullUsername(this.newRoomUser);
                    this.userExists = await matrixService.existsUser(this.newRoomUser);
                    this.checking = false;
                }, 700, "MATRIX_CHECK_USER");
            },
            async createRoom() {
                if (this.createRoomDisabled) {
                    return;
                }
                this.createRoomState = CREATE_ROOM_STATES.LOADING;
                let result = await matrixService.createPrivateRoom(this.fullUsername, this.newRoomEncrypted, this.newRoomName);
                this.rooms = await matrixService.getRooms();
                this.createRoomState = result ? CREATE_ROOM_STATES.SUCCESS : CREATE_ROOM_STATES.ERROR;
            },
            async leaveRoom(room) {
                if(!confirm(i18nService.t("doYouReallyWantToLeaveRoom", room.name))) {
                    return;
                }
                this.leavingRoom = room;
                this.$nextTick(async () => {
                    await matrixService.leaveRoom(room.roomId);
                });
            },
            isPrivateRoom(room) {
                return room.getMembers().length === 2;
            },
            getPrivateRoomPartner(room) {
                let names = room.getMembers().map(m => m.name);
                return names.filter(name => name !== this.loggedInUser)[0];
            },
            getAllMembersString(room) {
                let names = room.getMembers().map(m => m.name);
                names.sort((a, b) => {
                    if (a === this.loggedInUser) {
                        return -1;
                    }
                    if (b === this.loggedInUser) {
                        return 1;
                    }
                    return a.localeCompare(b);
                });
                return names.join(', ');
            },
            onRoomChange(rooms) {
                this.rooms = rooms;
            }
        },
        async mounted() {
            this.rooms = await matrixService.getRooms() || [];
            this.canUseEncryption = matrixService.isEncryptionEnabled();
            this.newRoomEncrypted = this.canUseEncryption;
            this.loggedInUserFull = await matrixService.getUsername(true);
            this.loggedInUser = await matrixService.getUsername();
            matrixService.onRoomChange(this.onRoomChange);
        },
        beforeDestroy() {
            matrixService.onRoomChange(null);
        }
    }
</script>

<style scoped>
    .matrix-sala-nome { display: flex; align-items: center; gap: var(--g-e2); }
    .matrix-sala-nome .ti { font-size: 1.3em; flex: none; }
    .matrix-cadeado { color: var(--g-folha-escura); }
    .matrix-cadeado-aberto { color: var(--g-perigo); }
    .matrix-sala-membros { display: block; font-weight: 400; color: var(--g-tinta-2); font-size: var(--g-t-legenda); }
    .matrix-busca { display: flex; align-items: center; gap: var(--g-e1); margin: 0; }
    .matrix-acoes { display: flex; flex-wrap: wrap; align-items: center; gap: var(--g-e3); }
    .matrix-resultado { display: inline-flex; align-items: center; gap: var(--g-e1); margin: 0; }
    .matrix-ok { color: var(--g-folha-escura); font-weight: 700; }
    .matrix-girando { display: inline-block; animation: matrix-girar 1s linear infinite; }
    @keyframes matrix-girar { to { transform: rotate(360deg); } }
    @media (prefers-reduced-motion: reduce) { .matrix-girando { animation: none; } }
</style>
