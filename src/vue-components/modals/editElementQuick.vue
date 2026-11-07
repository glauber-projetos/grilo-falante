<template>
    <div class="modal">
        <div class="modal-mask quick-mask" @click.self="close()">
            <div class="quick-sheet" role="dialog" aria-modal="true" aria-labelledby="quickEditTitle" @keydown.esc="close()">
                <div v-if="!element" class="quick-loading"><i class="fas fa-spinner fa-spin" aria-hidden="true"></i></div>
                <template v-if="element">
                    <div class="quick-top">
                        <div class="quick-preview" :style="previewStyle" aria-hidden="true">
                            <img v-if="imageSrc" :src="imageSrc" alt=""/>
                            <span class="quick-preview-label">{{ label }}</span>
                        </div>
                        <div class="quick-title-box">
                            <h1 id="quickEditTitle" class="quick-title">{{ label || $t('quickEditNoText') }}</h1>
                            <span class="quick-subtitle">{{ view === VIEW_MAIN ? $t('quickEditWhatToChange') : viewTitle }}</span>
                        </div>
                        <button type="button" class="quick-close" @click="close()" :aria-label="$t('close')" :title="$t('close')"><i class="fas fa-times"></i></button>
                    </div>

                    <div v-if="view === VIEW_MAIN" class="quick-actions">
                        <button type="button" class="quick-action" @click="view = VIEW_PHOTO">
                            <i class="fas fa-camera" aria-hidden="true"></i><span>{{ $t('takePhoto') }}</span>
                        </button>
                        <button type="button" class="quick-action" @click="view = VIEW_VOICE">
                            <i class="fas fa-microphone" aria-hidden="true"></i><span>{{ $t('recordVoice') }}</span>
                            <small v-if="hasAudio" class="quick-badge">{{ $t('ownVoiceActive') }}</small>
                        </button>
                        <button type="button" class="quick-action" @click="openText()">
                            <i class="fas fa-pen" aria-hidden="true"></i><span>{{ $t('changeText') }}</span>
                        </button>
                        <button type="button" class="quick-action" @click="toggleHidden()" :aria-pressed="String(!!element.hidden)">
                            <i :class="element.hidden ? 'fas fa-eye' : 'fas fa-eye-slash'" aria-hidden="true"></i>
                            <span>{{ element.hidden ? $t('showButton') : $t('hideButton') }}</span>
                        </button>
                    </div>
                    <p v-if="view === VIEW_MAIN && element.hidden" class="quick-note">{{ $t('hiddenButtonKeepsPlace') }}</p>

                    <div v-if="view === VIEW_PHOTO" class="quick-sub">
                        <photo-picker facing="environment" :cell-aspect="cellAspect" :output-width="400" @photo="onPhoto" @cancel="view = VIEW_MAIN"/>
                    </div>

                    <div v-if="view === VIEW_VOICE" class="quick-sub">
                        <voice-recorder :recording="currentRecording" :max-ms="maxRecordMs" @recorded="onRecorded"/>
                        <button v-if="hasAudio" type="button" class="quick-link-btn" @click="removeAudio()">
                            <i class="fas fa-trash-alt" aria-hidden="true"></i> {{ $t('useDeviceVoiceAgain') }}
                        </button>
                    </div>

                    <div v-if="view === VIEW_TEXT" class="quick-sub">
                        <label for="quickEditText" class="quick-label">{{ $t('textOfTheButton') }}</label>
                        <input id="quickEditText" ref="textInput" type="text" class="quick-input" v-model="textDraft" maxlength="60" @keydown.enter.prevent="saveText()"/>
                        <button type="button" class="quick-primary" @click="saveText()">{{ $t('save') }}</button>
                    </div>

                    <p v-if="savedMessage" class="quick-saved" role="status"><i class="fas fa-check" aria-hidden="true"></i> {{ savedMessage }}</p>

                    <div class="quick-footer">
                        <button v-if="view !== VIEW_MAIN" type="button" @click="view = VIEW_MAIN"><i class="fas fa-arrow-left" aria-hidden="true"></i> {{ $t('back') }}</button>
                        <button v-if="view === VIEW_MAIN" type="button" @click="moreOptions()"><i class="fas fa-sliders-h" aria-hidden="true"></i> {{ $t('moreOptions') }}</button>
                        <button type="button" class="quick-primary" @click="close()">{{ $t('done') }}</button>
                    </div>
                </template>
            </div>
        </div>
    </div>
</template>

<script>
/**
 * Quick edit panel (Grilo Falante): opens when an adult holds a button for 1 second in the grid view
 * (never in the locked child mode). Big, simple options: take photo, record voice, change text and
 * hide/show. Every change is saved immediately. "More options" opens the full editor.
 *
 * props:
 * - gridIds: ids of the grids the element can belong to (current grid, global grid)
 * - elementId: id of the held element
 *
 * events: close, changed
 */
import './../../css/modal.css';
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
        elementId: { type: String, required: true }
    },
    data() {
        return {
            gridData: null,
            element: null,
            view: VIEW_MAIN,
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
.quick-mask {
    z-index: 9999;
    display: flex;
    align-items: flex-end;
    justify-content: center;
}

.quick-sheet {
    background: #FFFFFF;
    color: var(--gf-tinta, #14261A);
    width: 100%;
    max-width: 44em;
    max-height: 92vh;
    overflow-y: auto;
    border-radius: 1.2em 1.2em 0 0;
    padding: 1em 1.2em 1.2em;
    display: flex;
    flex-direction: column;
    gap: 0.9em;
    box-shadow: 0 -0.3em 1.5em rgba(20, 38, 26, 0.25);
}

@media (min-height: 700px) and (min-width: 700px) {
    .quick-mask {
        align-items: center;
    }
    .quick-sheet {
        border-radius: 1.2em;
    }
}

.quick-loading {
    text-align: center;
    padding: 2em;
    font-size: 1.5em;
}

.quick-top {
    display: flex;
    align-items: center;
    gap: 0.9em;
}

.quick-preview {
    width: 4.5em;
    height: 4.5em;
    flex: none;
    border: 2px solid var(--gf-linha, #D3E0D0);
    border-radius: 0.6em;
    background: #FFFFFF;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    font-weight: 700;
    font-size: 0.85em;
}

.quick-preview img {
    max-width: 100%;
    min-height: 0;
    flex: 1;
    object-fit: contain;
}

.quick-preview-label {
    padding: 0 0.2em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
}

.quick-title-box {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
}

.quick-title {
    font-size: 1.5em;
    margin: 0;
    line-height: 1.1;
    overflow-wrap: anywhere;
}

.quick-subtitle {
    color: var(--gf-cinza, #4A5C4F);
}

.quick-close {
    flex: none;
    width: 2.8em;
    height: 2.8em;
    padding: 0;
    margin: 0;
    font-size: 1em;
}

.quick-actions {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 0.6em;
}

@media (max-width: 480px) {
    .quick-actions {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }
}

.quick-action {
    margin: 0;
    height: auto;
    min-height: 6em;
    padding: 0.8em 0.4em;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.4em;
    text-transform: none;
    letter-spacing: 0;
    line-height: 1.2;
    white-space: normal;
    font-size: 1.05em;
    position: relative;
}

.quick-action i {
    font-size: 1.8em;
    color: var(--gf-mata, #1D6B35);
}

.quick-badge {
    font-size: 0.75em;
    font-weight: 700;
    background: var(--gf-folha, #E7F2E0);
    color: var(--gf-mata, #1D6B35);
    border-radius: 999px;
    padding: 0.1em 0.6em;
}

.quick-note {
    margin: 0;
    background: var(--gf-folha, #E7F2E0);
    border-radius: 0.6em;
    padding: 0.6em 0.9em;
}

.quick-sub {
    display: flex;
    flex-direction: column;
    gap: 0.6em;
}

.quick-label {
    font-weight: 700;
}

.quick-input {
    width: 100%;
    font-size: 1.3em;
    min-height: 2.4em;
    margin: 0;
}

.quick-link-btn {
    align-self: flex-start;
    margin: 0;
    text-transform: none;
    letter-spacing: 0;
    color: var(--gf-coral, #B8391F);
}

.quick-saved {
    margin: 0;
    color: var(--gf-mata, #1D6B35);
    font-weight: 700;
}

.quick-footer {
    display: flex;
    gap: 0.6em;
}

.quick-footer button {
    flex: 1;
    margin: 0;
    min-height: 3em;
    text-transform: none;
    letter-spacing: 0;
    font-size: 1em;
}

.quick-primary {
    background-color: var(--gf-mata, #1D6B35);
    border-color: var(--gf-mata, #1D6B35);
    color: #FFFFFF;
    margin: 0;
    min-height: 3em;
    text-transform: none;
    letter-spacing: 0;
}

.quick-primary:hover,
.quick-primary:focus {
    background-color: var(--gf-mata-escuro, #175A2C);
    border-color: var(--gf-tinta, #14261A);
    color: #FFFFFF;
}
</style>
