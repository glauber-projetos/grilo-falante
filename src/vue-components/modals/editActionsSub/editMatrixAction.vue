<template>
    <div class="mx">
        <div class="g-campo">
            <label for="actionType">{{ $t('gestaoAcaoOQueFazer') }}</label>
            <select id="actionType" v-model="action.action" @change="actionTypeChanged">
                <option :value="undefined" disabled selected hidden>{{ $t("pleaseSelect") }}</option>
                <option v-for="action in GridActionMatrix.getActions()" :value="action">{{ $t(action) }}</option>
            </select>
        </div>
        <div class="g-campo" v-if="action.action === GridActionMatrix.actions.MATRIX_SEND_CUSTOM">
            <label for="sendText">{{ $t("textToSend") }}</label>
            <input id="sendText" v-model="action.sendText" spellcheck="false"
                   type="text" :placeholder="$t('textToSend')"/>
        </div>
        <div class="g-campo" v-if="action.action === GridActionMatrix.actions.MATRIX_SCROLL_UP || action.action === GridActionMatrix.actions.MATRIX_SCROLL_DOWN">
            <label for="scrollPx">{{ $t("scrollPx") }}</label>
            <input id="scrollPx" v-model.number="action.scrollPx" type="number" min="1"/>
        </div>
        <div class="g-campo" v-if="action.action === GridActionMatrix.actions.MATRIX_SET_CONVERSATION">
            <label for="changeToRoom">{{ $t("changeToMatrixRoom") }}</label>
            <select id="changeToRoom" v-model="action.selectRoomId">
                <option :value="undefined" disabled selected hidden>{{ $t("pleaseSelect") }}</option>
                <option v-for="room in matrixRooms" :value="room.roomId">{{ room.name }}</option>
            </select>
        </div>
    </div>
</template>

<script>

import { GridActionMatrix } from '../../../js/model/GridActionMatrix';
import { matrixService } from '../../../js/service/matrixMessenger/matrixService';

export default {
    props: ['action'],
    data: function() {
        return {
            matrixRooms: [],
            GridActionMatrix: GridActionMatrix
        };
    },
    computed: {
    },
    methods: {
        actionTypeChanged() {
            if (this.action.action === GridActionMatrix.actions.MATRIX_SCROLL_UP || this.action.action === GridActionMatrix.actions.MATRIX_SCROLL_DOWN) {
                if (!this.action.scrollPx) {
                    this.action.scrollPx = 200;
                }
            } else {
                this.action.scrollPx = undefined;
            }
        }
    },
    async mounted() {
        this.matrixRooms = await matrixService.getRooms();
    }
}
</script>

<style scoped>
</style>
