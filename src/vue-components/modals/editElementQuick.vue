<template>
    <div class="quick-raiz">
        <div class="g-veu" @click="close()"></div>
        <div class="g-painel quick-sheet" role="dialog" aria-modal="true" aria-labelledby="quickEditTitle" @keydown.esc.stop="close()">
            <div class="g-painel-alca" aria-hidden="true"></div>
            <div v-if="!element" class="quick-loading" role="status"><i class="ti ti-loader-2" aria-hidden="true"></i></div>
            <template v-if="element">
                <div class="quick-top">
                    <div class="quick-preview" :style="previewStyle" aria-hidden="true">
                        <img v-if="imageSrc" :src="imageSrc" alt=""/>
                        <span class="quick-preview-label">{{ label }}</span>
                    </div>
                    <div class="quick-title-box">
                        <h2 id="quickEditTitle" class="quick-title">{{ label || $t('quickEditNoText') }}</h2>
                        <span class="g-apoio">{{ view === VIEW_MAIN ? $t('quickEditWhatToChange') : viewTitle }}</span>
                    </div>
                    <button type="button" class="g-btn g-btn-icone g-btn-leve" @click="close()" :aria-label="$t('close')" :title="$t('close')"><i class="ti ti-x" aria-hidden="true"></i></button>
                </div>

                <div v-if="view === VIEW_MAIN" class="quick-actions">
                    <button type="button" class="g-ladrilho g-ladrilho-ceu quick-action" @click="view = VIEW_PHOTO">
                        <i class="ti ti-camera" aria-hidden="true"></i><span>{{ $t('takePhoto') }}</span>
                    </button>
                    <button type="button" class="g-ladrilho g-ladrilho-pessego quick-action" @click="view = VIEW_VOICE">
                        <i class="ti ti-microphone" aria-hidden="true"></i>
                        <span>{{ $t('recordVoice') }}<small v-if="hasAudio">{{ $t('ownVoiceActive') }}</small></span>
                    </button>
                    <button type="button" class="g-ladrilho g-ladrilho-girassol quick-action" @click="openText()">
                        <i class="ti ti-pencil" aria-hidden="true"></i><span>{{ $t('changeText') }}</span>
                    </button>
                    <button type="button" class="g-ladrilho g-ladrilho-lavanda quick-action" @click="toggleHidden()" :aria-pressed="String(!!element.hidden)">
                        <i :class="element.hidden ? 'ti ti-eye' : 'ti ti-eye-off'" aria-hidden="true"></i>
                        <span>{{ element.hidden ? $t('showButton') : $t('hideButton') }}</span>
                    </button>
                </div>
                <p v-if="view === VIEW_MAIN && element.hidden" class="g-aviso quick-note"><i class="ti ti-eye-off" aria-hidden="true"></i><span>{{ $t('hiddenButtonKeepsPlace') }}</span></p>

                <div v-if="view === VIEW_PHOTO" class="quick-sub">
                    <photo-picker facing="environment" :cell-aspect="cellAspect" :output-width="400" @photo="onPhoto" @cancel="onPhotoCancel()"/>
                </div>

                <div v-if="view === VIEW_VOICE" class="quick-sub">
                    <voice-recorder :recording="currentRecording" :max-ms="maxRecordMs" @recorded="onRecorded"/>
                    <button v-if="hasAudio" type="button" class="g-btn g-btn-perigo quick-link-btn" @click="removeAudio()">
                        <i class="ti ti-trash" aria-hidden="true"></i>{{ $t('useDeviceVoiceAgain') }}
                    </button>
                </div>

                <div v-if="view === VIEW_TEXT" class="quick-sub">
                    <div class="g-campo">
                        <label for="quickEditText">{{ $t('textOfTheButton') }}</label>
                        <input id="quickEditText" ref="textInput" type="text" v-model="textDraft" maxlength="60" @keydown.enter.prevent="saveText()"/>
                    </div>
                    <button type="button" class="g-btn g-btn-principal g-btn-grande" @click="saveText()"><i class="ti ti-check" aria-hidden="true"></i>{{ $t('save') }}</button>
                </div>

                <p v-if="savedMessage" class="quick-saved" role="status"><i class="ti ti-circle-check" aria-hidden="true"></i> {{ savedMessage }}</p>

                <div class="quick-footer">
                    <button v-if="view !== VIEW_MAIN" type="button" class="g-btn" @click="view = VIEW_MAIN"><i class="ti ti-arrow-left" aria-hidden="true"></i>{{ $t('back') }}</button>
                    <button v-if="view === VIEW_MAIN" type="button" class="g-btn" @click="moreOptions()"><i class="ti ti-adjustments" aria-hidden="true"></i>{{ $t('moreOptions') }}</button>
                    <button type="button" class="g-btn g-btn-principal" @click="close()"><i class="ti ti-check" aria-hidden="true"></i>{{ $t('done') }}</button>
                </div>
            </template>
        </div>
    </div>
</template>

<script>
/**
 * Quick edit panel (Grilo Falante): opens when an adult holds a button for 1 second in the grid view
 * (never in the locked child mode), or after choosing a button for "Foto nova" in the Painel do Responsável.
 * Big, simple options: take photo, record voice, change text and hide/show.
 * Every change is saved immediately. "More options" opens the full editor.
 *
 * props:
 * - gridIds: ids of the grids the element can belong to (current grid, global grid)
 * - elementId: id of the held element
 * - inicio: optional, "foto" opens the camera directly
 *
 * events: close, changed
 */
import PhotoPicker from '../components/photoPicker.vue';
import VoiceRecorder from '../components/voiceRecorder.vue';
import { dataService } from '../../js/service/data/dataService';
import { i18nService } from '../../js/service/i18nService';
import { quickEditUtil } from '../../js/util/quickEditUtil';
import { Router } from '../../js/router';

const VIEW_MAIN = 'VIEW_MAIN';
const VIEW_PHOTO = 'VIEW_PHOTO';
const VIEW_VOICE = 'VIEW_VOICE';
const VIEW_TEXT = 'VIEW_TEXT';

export default {
    components: { PhotoPicker, VoiceRecorder },
    props: {
        gridIds: { type: Array, required: true },
        elementId: { type: String, required: true },
        inicio: { type: String, default: null }
    },
    data() {
        return {
            gridData: null,
            element: null,
            view: this.inicio === 'foto' ? VIEW_PHOTO : VIEW_MAIN,
            textDraft: '',
            lang: i18nService.getContentLang(),
            cellAspect: 1,
            savedMessage: '',
            savedTimeout: null,
            changed: false,
            maxRecordMs: quickEditUtil.MAX_RECORD_MS,
            VIEW_MAIN, VIEW_PHOTO, VIEW_VOICE, VIEW_TEXT
        };
    },
    computed: {
        label() {
            return this.element ? i18nService.getTranslation(this.element.label) || '' : '';
        },
        imageSrc() {
            return this.element && this.element.image ? (this.element.image.data || this.element.image.url) : null;
        },
        hasAudio() {
            return quickEditUtil.hasAudio(this.element);
        },
        currentRecording() {
            let action = quickEditUtil.getAudioAction(this.element);
            return action ? { base64: action.dataBase64, mimeType: action.mimeType, durationMs: action.durationMs } : null;
        },
        previewStyle() {
            return this.element && this.element.backgroundColor ? { backgroundColor: this.element.backgroundColor } : {};
        },
        viewTitle() {
            switch (this.view) {
                case VIEW_PHOTO: return this.$t('takePhoto');
                case VIEW_VOICE: return this.$t('recordVoice');
                case VIEW_TEXT: return this.$t('changeText');
            }
            return '';
        }
    },
    methods: {
        async load() {
            for (let id of this.gridIds.filter(Boolean)) {
                let grid = await dataService.getGrid(id, false, true);
                let found = grid ? grid.gridElements.find((e) => e.id === this.elementId) : null;
                if (found) {
                    this.gridData = JSON.parse(JSON.stringify(grid));
                    this.element = JSON.parse(JSON.stringify(found));
                    return;
                }
            }
            this.close();
        },
        async save(message) {
            quickEditUtil.replaceElement(this.gridData, JSON.parse(JSON.stringify(this.element)));
            await dataService.saveGrid(this.gridData, { clearThumbnail: true });
            this.changed = true;
            this.showSaved(message || this.$t('saved'));
        },
        showSaved(message) {
            clearTimeout(this.savedTimeout);
            this.savedMessage = message;
            this.savedTimeout = setTimeout(() => {
                this.savedMessage = '';
            }, 2500);
        },
        async onPhoto(base64) {
            quickEditUtil.setPhoto(this.element, base64);
            await this.save(this.$t('photoSaved'));
            this.view = VIEW_MAIN;
        },
        onPhotoCancel() {
            if (this.inicio === 'foto' && !this.changed) {
                this.close(); // came directly from "Foto nova": cancel closes everything
                return;
            }
            this.view = VIEW_MAIN;
        },
        async onRecorded(recording) {
            quickEditUtil.setAudio(this.element, recording);
            await this.save(this.$t('voiceSaved'));
        },
        async removeAudio() {
            quickEditUtil.removeAudio(this.element);
            await this.save(this.$t('deviceVoiceActiveAgain'));
        },
        openText() {
            this.textDraft = quickEditUtil.getLabel(this.element, this.lang) || this.label;
            this.view = VIEW_TEXT;
            this.$nextTick(() => {
                if (this.$refs.textInput) {
                    this.$refs.textInput.focus();
                    this.$refs.textInput.select();
                }
            });
        },
        async saveText() {
            quickEditUtil.setLabel(this.element, this.textDraft, this.lang);
            await this.save(this.$t('textSaved'));
            this.view = VIEW_MAIN;
        },
        async toggleHidden() {
            quickEditUtil.setHidden(this.element, !this.element.hidden);
            await this.save(this.element.hidden ? this.$t('buttonHidden') : this.$t('buttonShown'));
        },
        moreOptions() {
            let gridId = this.gridData ? this.gridData.id : null;
            let elementId = this.elementId;
            this.$emit('close');
            Router.toEditGrid(gridId, elementId);
        },
        close() {
            if (this.changed) {
                this.$emit('changed');
            }
            this.$emit('close');
        },
        computeCellAspect() {
            let elem = document.getElementById(this.elementId);
            if (!elem) {
                return;
            }
            let rect = elem.getBoundingClientRect();
            let imageAreaH = rect.height * 0.75; // the text uses about a quarter of the cell
            if (rect.width > 0 && imageAreaH > 0) {
                this.cellAspect = Math.min(3, Math.max(0.33, rect.width / imageAreaH));
            }
        }
    },
    mounted() {
        this.computeCellAspect();
        this.load();
    },
    beforeDestroy() {
        clearTimeout(this.savedTimeout);
    }
};
</script>

<style scoped>
.quick-raiz { position: relative; z-index: 9999; }
.quick-raiz .g-veu { z-index: 9998; }
.quick-sheet {
    z-index: 9999;
    font-family: var(--g-fonte);
    color: var(--g-tinta);
    display: flex;
    flex-direction: column;
    gap: var(--g-e4);
    max-height: 92vh;
    padding-bottom: calc(var(--g-e5) + env(safe-area-inset-bottom, 0px));
}
.quick-sheet .g-painel-alca { margin-bottom: 0; }

.quick-loading { text-align: center; padding: var(--g-e6); font-size: 38.4px; color: var(--g-folha); }
.quick-loading .ti { display: inline-block; animation: quick-girar 1s linear infinite; }
@keyframes quick-girar { to { transform: rotate(360deg); } }

.quick-top { display: flex; align-items: center; gap: var(--g-e4); }
.quick-preview {
    width: 76px;
    height: 76px;
    flex: none;
    border: 2px solid var(--g-borda);
    border-radius: var(--g-raio);
    background: var(--g-superficie);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    font-weight: 700;
    font-size: var(--g-t-legenda);
}
.quick-preview img { max-width: 100%; min-height: 0; flex: 1; object-fit: contain; }
.quick-preview-label { padding: 0 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
.quick-title-box { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.quick-title {
    font-family: var(--g-fonte-titulo);
    font-size: var(--g-t-h2);
    font-weight: 700;
    margin: 0;
    line-height: 1.1;
    overflow-wrap: anywhere;
    color: var(--g-tinta);
}

.quick-actions { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: var(--g-e3); }
.quick-action { min-height: 116px; }
.quick-action:focus { outline: none; }
.quick-action:focus-visible { box-shadow: var(--g-foco); }
.quick-note { margin: 0; }

.quick-sub { display: flex; flex-direction: column; gap: var(--g-e3); }
.quick-sub .g-campo { margin-bottom: 0; }
.quick-link-btn { align-self: flex-start; }
.quick-saved { margin: 0; color: var(--g-folha-escura); font-weight: 700; display: flex; align-items: center; gap: var(--g-e2); }
.quick-saved .ti { font-size: 22.4px; }

.quick-footer { display: flex; gap: var(--g-e3); }
.quick-footer .g-btn { flex: 1; min-height: var(--g-alvo-g); }

@media (max-width: 600px) {
    .quick-actions { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--g-e2); }
    .quick-action { min-height: 96px; padding: var(--g-e3); }
    .quick-title { font-size: var(--g-t-h3); }
    .quick-preview { width: 60px; height: 60px; }
    .quick-footer { gap: var(--g-e2); }
    .quick-footer .g-btn { padding: 0 var(--g-e3); font-size: var(--g-t-legenda); }
}
@media (prefers-reduced-motion: reduce) {
    .quick-loading .ti { animation: none; }
}
</style>
