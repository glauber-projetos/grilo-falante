<template>
    <div class="overflow-content wz-page">
        <div class="wz-wrap">
            <header class="wz-header">
                <img src="app/img/grilo/grilo-acenando.svg" alt="" aria-hidden="true" class="wz-grilo"/>
                <div class="wz-header-text">
                    <span class="wz-step-label">{{ $t('wizardStepOf', {step: step, total: TOTAL}) }}</span>
                    <div class="wz-dots" aria-hidden="true">
                        <i v-for="n in TOTAL" :key="n" :class="{on: n <= step}"></i>
                    </div>
                </div>
                <button type="button" class="wz-later" @click="doLater()">{{ $t('wizardDoLater') }}</button>
            </header>

            <!-- 1: nome e foto -->
            <section v-if="step === 1" class="wz-step" aria-labelledby="wzTitle1">
                <h1 id="wzTitle1" class="wz-question">{{ $t('wizardNameQuestion') }}</h1>
                <input id="wzName" ref="nameInput" type="text" class="wz-input" v-model.trim="childName" maxlength="40"
                       :aria-label="$t('wizardNameLabel')" :placeholder="$t('wizardNamePlaceholder')" autocomplete="off" @keydown.enter.prevent="next()"/>
                <h2 class="wz-sub">{{ $t('wizardPhotoTitle') }}</h2>
                <p class="wz-hint">{{ $t('wizardPhotoHint') }}</p>
                <div class="wz-photo-row">
                    <div class="wz-photo" :class="{empty: !childPhoto}">
                        <img v-if="childPhoto" :src="childPhoto" :alt="$t('wizardPhotoAlt', {name: displayName})"/>
                        <i v-else class="fas fa-child" aria-hidden="true"></i>
                    </div>
                    <div class="wz-photo-actions">
                        <photo-picker facing="user" :cell-aspect="1" :output-width="400" @photo="childPhoto = $event"/>
                        <button v-if="childPhoto" type="button" class="wz-link" @click="childPhoto = null">{{ $t('wizardRemovePhoto') }}</button>
                    </div>
                </div>
                <p class="wz-privacy"><i class="fas fa-lock" aria-hidden="true"></i> {{ $t('wizardPhotoPrivacy') }}</p>
            </section>

            <!-- 2: idade -->
            <section v-if="step === 2" class="wz-step" aria-labelledby="wzTitle2">
                <h1 id="wzTitle2" class="wz-question">{{ $t('wizardAgeQuestion', {name: displayName}) }}</h1>
                <div class="wz-options" role="radiogroup" :aria-labelledby="'wzTitle2'">
                    <button v-for="age in AGES" :key="age.value" type="button" role="radio" class="wz-option"
                            :aria-checked="String(ageGroup === age.value)" :class="{selected: ageGroup === age.value}" @click="setAge(age.value)">
                        <span>{{ $t(age.label) }}</span>
                        <i v-if="ageGroup === age.value" class="fas fa-check" aria-hidden="true"></i>
                    </button>
                </div>
                <p class="wz-hint">{{ $t('wizardAgeHint') }}</p>
            </section>

            <!-- 3: voz -->
            <section v-if="step === 3" class="wz-step" aria-labelledby="wzTitle3">
                <h1 id="wzTitle3" class="wz-question">{{ childName ? $t('wizardVoiceQuestion', {name: childName}) : $t('wizardVoiceQuestionNoName') }}</h1>
                <p v-if="voicesLoading"><i class="fas fa-spinner fa-spin" aria-hidden="true"></i></p>
                <div v-if="!voicesLoading && voices.length" class="wz-options" role="radiogroup" aria-labelledby="wzTitle3">
                    <div v-for="(voice, index) in voices" :key="voice.id" class="wz-option wz-voice" :class="{selected: voiceId === voice.id}">
                        <button type="button" role="radio" class="wz-voice-select" :aria-checked="String(voiceId === voice.id)" @click="voiceId = voice.id">
                            <span>{{ $t('wizardVoiceN', {n: index + 1}) }}</span>
                            <small>{{ voice.name }}<template v-if="voice.type !== VOICE_TYPE_NATIVE"> · {{ $t('wizardNeedsInternet') }}</template></small>
                        </button>
                        <button type="button" class="wz-listen" @click="listen(voice.id)" :aria-label="$t('listen') + ': ' + $t('wizardVoiceN', {n: index + 1})">
                            <i class="fas fa-play" aria-hidden="true"></i> {{ $t('listen') }}
                        </button>
                    </div>
                </div>
                <div v-if="!voicesLoading && voices.length">
                    <h2 class="wz-sub">{{ $t('wizardSpeed') }}</h2>
                    <div class="wz-segmented" role="radiogroup" :aria-label="$t('wizardSpeed')">
                        <button v-for="speed in SPEEDS" :key="speed.value" type="button" role="radio" :aria-checked="String(voiceRate === speed.value)"
                                :class="{selected: voiceRate === speed.value}" @click="voiceRate = speed.value; listen(voiceId)">{{ $t(speed.label) }}</button>
                    </div>
                </div>
                <div v-if="!voicesLoading && !voices.length" class="wz-novoice">
                    <p><strong>{{ $t('wizardNoVoice') }}</strong></p>
                    <offline-voice-helper :can-select="true" :current-voice-id="voiceId" @use-voice="useOfflineVoice"/>
                </div>
            </section>

            <!-- 4: tamanho -->
            <section v-if="step === 4" class="wz-step" aria-labelledby="wzTitle4">
                <h1 id="wzTitle4" class="wz-question">{{ $t('wizardSizeQuestion') }}</h1>
                <div class="wz-sizes" role="radiogroup" aria-labelledby="wzTitle4">
                    <button v-for="s in SIZES" :key="s.value" type="button" role="radio" class="wz-size"
                            :aria-checked="String(size === s.value)" :class="{selected: size === s.value}" @click="size = s.value">
                        <span class="wz-mini" :style="{'grid-template-columns': `repeat(${s.cols}, 1fr)`}" aria-hidden="true">
                            <i v-for="n in s.cols * s.rows" :key="n"></i>
                        </span>
                        <strong>{{ $t(s.label) }}</strong>
                        <span>{{ $t('wizardButtonsPerScreen', {n: s.cols * s.rows}) }}</span>
                        <small v-if="s.value === suggestedSize" class="wz-badge">{{ $t('wizardSuggestedForAge') }}</small>
                    </button>
                </div>
                <p class="wz-hint">{{ $t('wizardSizeHint') }}</p>
            </section>

            <!-- 5: prancha pronta -->
            <section v-if="step === 5" class="wz-step" aria-labelledby="wzTitle5">
                <h1 id="wzTitle5" class="wz-question">{{ childName ? $t('wizardBoardReady', {name: childName}) : $t('wizardBoardReadyNoName') }}</h1>
                <p class="wz-hint">{{ $t('wizardBoardHint') }}</p>
                <div class="wz-board" :style="{'grid-template-columns': `repeat(${previewColumns}, minmax(0, 1fr))`}" aria-hidden="true">
                    <div v-for="cell in previewCells" :key="cell.key" class="wz-cell" :class="{hidden: cell.hidden, folder: cell.folder}">
                        <img v-if="cell.img" :src="cell.img" alt=""/>
                        <span>{{ cell.label }}</span>
                    </div>
                </div>
                <p v-if="hiddenCount" class="wz-note">{{ $t('wizardHiddenWords', {n: hiddenCount}) }}</p>
                <ul class="wz-tips">
                    <li><i class="fas fa-hand-pointer" aria-hidden="true"></i> {{ $t('wizardTipHold') }}</li>
                    <li><i class="fas fa-lock" aria-hidden="true"></i> {{ $t('wizardTipLock') }}</li>
                </ul>
                <p class="wz-credit">{{ ARASAAC_CREDIT }}</p>
                <p v-if="error" class="wz-error" role="alert">{{ $t('wizardSaveError') }}</p>
            </section>

            <footer class="wz-footer">
                <button v-if="step > 1" type="button" class="wz-btn" @click="back()" :disabled="saving"><i class="fas fa-arrow-left" aria-hidden="true"></i> {{ $t('back') }}</button>
                <button v-if="step === 1" type="button" class="wz-btn" @click="next()">{{ $t('wizardSkip') }}</button>
                <button v-if="step < TOTAL" type="button" class="wz-btn wz-primary" @click="next()">{{ $t('wizardNext') }} <i class="fas fa-arrow-right" aria-hidden="true"></i></button>
                <button v-if="step === TOTAL" type="button" class="wz-btn wz-primary" @click="finish()" :disabled="saving">
                    <i v-if="saving" class="fas fa-spinner fa-spin" aria-hidden="true"></i> {{ $t('wizardStart') }}
                </button>
            </footer>
        </div>
    </div>
</template>

<script>
/**
 * Setup wizard on first use (Grilo Falante): name and photo, age, voice, button size and a
 * ready starter board in Brazilian Portuguese. Every step can be skipped and changed later.
 */
import PhotoPicker from '../components/photoPicker.vue';
import OfflineVoiceHelper from '../views/settings/offlineVoiceHelper.vue';
import { setupWizard } from '../../js/wizard/setupWizard';
import { starterBoard } from '../../js/wizard/starterBoard';
import {
    WORDS, TOPICS, ARASAAC_CREDIT, SIZE_LARGE, SIZE_MEDIUM, SIZE_SMALL, AGE_2_3, AGE_4_6, AGE_7_10, AGE_11
} from '../../js/wizard/starterBoardData';
import { speechService } from '../../js/service/speechService';
import { localStorageService } from '../../js/service/data/localStorageService';
import { Router } from '../../js/router';
import { pickWizardVoices } from '../../js/wizard/wizardVoices';

const TOTAL = 5;

export default {
    components: { PhotoPicker, OfflineVoiceHelper },
    data() {
        return {
            TOTAL,
            ARASAAC_CREDIT,
            VOICE_TYPE_NATIVE: 'VOICE_TYPE_NATIVE',
            AGES: [
                { value: AGE_2_3, label: 'wizardAge23' },
                { value: AGE_4_6, label: 'wizardAge46' },
                { value: AGE_7_10, label: 'wizardAge710' },
                { value: AGE_11, label: 'wizardAge11' }
            ],
            SIZES: [
                { value: SIZE_LARGE, label: 'wizardSizeLarge', cols: 4, rows: 3 },
                { value: SIZE_MEDIUM, label: 'wizardSizeMedium', cols: 5, rows: 4 },
                { value: SIZE_SMALL, label: 'wizardSizeSmall', cols: 6, rows: 5 }
            ],
            SPEEDS: [
                { value: 0.8, label: 'wizardSlower' },
                { value: 1, label: 'wizardNormal' },
                { value: 1.2, label: 'wizardFaster' }
            ],
            step: 1,
            childName: '',
            childPhoto: null,
            ageGroup: AGE_4_6,
            size: SIZE_MEDIUM,
            sizeChosen: false,
            voices: [],
            voicesLoading: true,
            voiceId: null,
            voiceRate: 1,
            images: null,
            saving: false,
            error: false
        };
    },
    computed: {
        displayName() {
            return this.childName || this.$t('wizardTheChild');
        },
        suggestedSize() {
            return starterBoard.getAgeSuggestion(this.ageGroup).size;
        },
        previewColumns() {
            return Math.max(...starterBoard.getLayout(this.size).map((row) => row.length));
        },
        hiddenKeys() {
            return starterBoard.getHiddenKeys(this.size, this.ageGroup);
        },
        hiddenCount() {
            return this.hiddenKeys.length;
        },
        previewCells() {
            let cells = [];
            for (let key of starterBoard.getLayout(this.size).flat()) {
                let topic = TOPICS[key];
                let imageKey = topic ? topic.image : key;
                let img = this.images && this.images[imageKey] ? this.images[imageKey].data : null;
                if (key === 'eu' && this.childPhoto) {
                    img = this.childPhoto;
                }
                cells.push({
                    key: key,
                    label: topic ? topic.label : WORDS[key].label,
                    img: img,
                    folder: !!topic,
                    hidden: this.hiddenKeys.includes(key)
                });
            }
            return cells;
        }
    },
    methods: {
        setAge(value) {
            this.ageGroup = value;
            if (!this.sizeChosen) {
                this.size = starterBoard.getAgeSuggestion(value).size;
            }
        },
        next() {
            if (this.step === 4) {
                this.sizeChosen = true;
            }
            speechService.stopSpeaking();
            this.step = Math.min(TOTAL, this.step + 1);
            this.focusTitle();
        },
        back() {
            speechService.stopSpeaking();
            this.step = Math.max(1, this.step - 1);
            this.focusTitle();
        },
        focusTitle() {
            this.$nextTick(() => {
                let title = this.$el.querySelector('.wz-question');
                if (title) {
                    title.setAttribute('tabindex', '-1');
                    title.focus();
                }
            });
        },
        listen(voiceId) {
            if (!voiceId) {
                return;
            }
            let text = this.childName ? this.$t('wizardVoiceSampleName', {name: this.childName}) : this.$t('wizardVoiceSample');
            speechService.stopSpeaking();
            speechService.speak(text, { preferredVoice: voiceId, rate: this.voiceRate, useStandardRatePitch: false });
        },
        useOfflineVoice(voiceId) {
            this.voiceId = voiceId;
            this.loadVoices();
        },
        async loadVoices() {
            this.voicesLoading = true;
            let all = await speechService.getVoicesInitialized();
            this.voices = pickWizardVoices(all);
            let current = (localStorageService.getUserSettings().voiceConfig || {}).preferredVoice;
            if (!this.voiceId || !this.voices.some((v) => v.id === this.voiceId)) {
                this.voiceId = this.voices.some((v) => v.id === current) ? current : (this.voices[0] ? this.voices[0].id : null);
            }
            this.voicesLoading = false;
        },
        async finish() {
            this.saving = true;
            this.error = false;
            try {
                await setupWizard.saveVoice(this.voiceId, this.voiceRate);
                let mainGrid = await setupWizard.createStarterBoard({
                    childName: this.childName,
                    childPhoto: this.childPhoto,
                    ageGroup: this.ageGroup,
                    size: this.size,
                    boardName: this.childName ? this.$t('wizardBoardName', {name: this.childName}) : this.$t('wizardBoardNameDefault')
                });
                Router.toGrid(mainGrid.id);
            } catch (e) {
                log.warn('setup wizard: could not save', e);
                this.error = true;
            }
            this.saving = false;
        },
        doLater() {
            speechService.stopSpeaking();
            Router.toManageGrids();
        }
    },
    async mounted() {
        this.$nextTick(() => {
            if (this.$refs.nameInput) {
                this.$refs.nameInput.focus();
            }
        });
        this.loadVoices();
        try {
            this.images = await setupWizard.loadImages();
        } catch (e) {
            log.warn('setup wizard: could not load pictograms', e);
        }
    },
    beforeDestroy() {
        speechService.stopSpeaking();
    }
};
</script>

<style scoped>
.wz-page {
    background: var(--gf-fundo, #F3F8F0);
    color: var(--gf-tinta, #14261A);
    min-height: 100%;
}

.wz-wrap {
    max-width: 52em;
    margin: 0 auto;
    padding: 1.2em max(1em, env(safe-area-inset-left, 0px)) 2em;
    display: flex;
    flex-direction: column;
    gap: 1.2em;
}

.wz-header {
    display: flex;
    align-items: center;
    gap: 1em;
}

.wz-grilo {
    width: 4em;
    height: auto;
    flex: none;
}

.wz-header-text {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.35em;
}

.wz-step-label {
    font-weight: 700;
    color: var(--gf-cinza, #4A5C4F);
}

.wz-dots {
    display: flex;
    gap: 0.4em;
}

.wz-dots i {
    display: block;
    width: 2.2em;
    height: 0.45em;
    border-radius: 0.25em;
    background: var(--gf-linha, #D3E0D0);
}

.wz-dots i.on {
    background: var(--gf-mata, #1D6B35);
}

.wz-later {
    margin: 0;
    text-transform: none;
    letter-spacing: 0;
    font-size: 0.95em;
}

.wz-step {
    display: flex;
    flex-direction: column;
    gap: 0.9em;
}

.wz-question {
    font-size: clamp(1.6em, 4vw, 2.3em);
    line-height: 1.15;
    margin: 0;
    outline: none;
}

.wz-sub {
    font-size: 1.25em;
    margin: 0.4em 0 0;
}

.wz-hint,
.wz-privacy,
.wz-note,
.wz-credit {
    margin: 0;
    color: var(--gf-cinza, #4A5C4F);
    max-width: 60ch;
}

.wz-note {
    background: var(--gf-folha, #E7F2E0);
    color: var(--gf-tinta, #14261A);
    border-radius: 0.6em;
    padding: 0.6em 0.9em;
}

.wz-credit {
    font-size: 0.85em;
}

.wz-input {
    width: 100%;
    max-width: 24em;
    font-size: 1.4em;
    min-height: 2.4em;
    margin: 0;
}

.wz-photo-row {
    display: flex;
    gap: 1.2em;
    align-items: center;
    flex-wrap: wrap;
}

.wz-photo {
    width: 7em;
    height: 7em;
    border-radius: 50%;
    overflow: hidden;
    flex: none;
    background: var(--gf-folha, #E7F2E0);
    display: grid;
    place-items: center;
    border: 3px solid var(--gf-mata, #1D6B35);
}

.wz-photo.empty {
    border-style: dashed;
}

.wz-photo i {
    font-size: 3em;
    color: var(--gf-mata, #1D6B35);
}

.wz-photo img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.wz-photo-actions {
    flex: 1 1 18em;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 0.5em;
}

.wz-link {
    align-self: flex-start;
    margin: 0;
    text-transform: none;
    letter-spacing: 0;
}

.wz-options {
    display: grid;
    gap: 0.6em;
    max-width: 34em;
}

.wz-option {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.6em;
    margin: 0;
    min-height: 3.4em;
    padding: 0.5em 1em;
    text-align: left;
    text-transform: none;
    letter-spacing: 0;
    font-size: 1.15em;
    height: auto;
    background: #FFFFFF;
    border: 2px solid var(--gf-linha, #D3E0D0);
    border-radius: 12px;
}

.wz-option.selected {
    border-color: var(--gf-mata, #1D6B35);
    background: var(--gf-folha, #E7F2E0);
}

.wz-option i {
    color: var(--gf-mata, #1D6B35);
}

.wz-voice {
    padding: 0.3em 0.3em 0.3em 0.3em;
}

.wz-voice-select {
    flex: 1;
    min-width: 0;
    margin: 0;
    border: none;
    background: transparent;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    text-transform: none;
    letter-spacing: 0;
    font-size: 1em;
    height: auto;
    padding: 0.3em 0.7em;
}

.wz-voice-select:hover,
.wz-voice-select:focus {
    background: transparent;
    border: none;
}

.wz-voice-select small {
    font-weight: 400;
    color: var(--gf-cinza, #4A5C4F);
    font-size: 0.75em;
    overflow-wrap: anywhere;
}

.wz-listen {
    margin: 0;
    flex: none;
    text-transform: none;
    letter-spacing: 0;
}

.wz-segmented {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5em;
}

.wz-segmented button {
    margin: 0;
    flex: 1 1 8em;
    min-height: 3em;
    text-transform: none;
    letter-spacing: 0;
    font-size: 1em;
}

.wz-segmented button.selected {
    border-color: var(--gf-mata, #1D6B35);
    background: var(--gf-folha, #E7F2E0);
}

.wz-sizes {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.8em;
}

@media (max-width: 560px) {
    .wz-sizes {
        grid-template-columns: minmax(0, 1fr);
    }
}

.wz-size {
    margin: 0;
    height: auto;
    padding: 0.9em;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.4em;
    text-transform: none;
    letter-spacing: 0;
    font-size: 1.05em;
    font-weight: 400;
    background: #FFFFFF;
    border: 2px solid var(--gf-linha, #D3E0D0);
    border-radius: 12px;
}

.wz-size.selected {
    border-color: var(--gf-mata, #1D6B35);
    background: var(--gf-folha, #E7F2E0);
}

.wz-size strong {
    font-size: 1.15em;
}

.wz-mini {
    display: grid;
    gap: 3px;
    width: 100%;
    max-width: 9em;
    margin-bottom: 0.3em;
}

.wz-mini i {
    display: block;
    aspect-ratio: 1.2;
    border: 1.5px solid var(--gf-cinza, #4A5C4F);
    border-radius: 3px;
    background: #FFFFFF;
}

.wz-badge {
    font-weight: 700;
    color: var(--gf-mata, #1D6B35);
    background: #FFFFFF;
    border: 1.5px solid var(--gf-mata, #1D6B35);
    border-radius: 999px;
    padding: 0.05em 0.7em;
}

.wz-board {
    display: grid;
    gap: 0.4em;
    background: #E8E8E8;
    border-radius: 12px;
    padding: 0.5em;
}

.wz-cell {
    background: #FFFFFF;
    border: 2px solid var(--gf-linha, #D3E0D0);
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 0.3em 0.2em;
    min-width: 0;
    aspect-ratio: 1.15;
    font-weight: 700;
    font-size: 0.9em;
    text-align: center;
    line-height: 1.1;
    overflow: hidden;
}

.wz-cell img {
    flex: 1;
    min-height: 0;
    max-width: 100%;
    object-fit: contain;
}

.wz-cell span {
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.wz-cell.folder {
    border-color: var(--gf-mata, #1D6B35);
    border-top-width: 6px;
}

.wz-cell.hidden {
    border-style: dashed;
    opacity: 0.4;
    filter: grayscale(1);
}

.wz-tips {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 0.4em;
}

.wz-tips li {
    display: flex;
    gap: 0.6em;
    align-items: baseline;
}

.wz-tips i {
    color: var(--gf-mata, #1D6B35);
    width: 1.2em;
    text-align: center;
}

.wz-error {
    margin: 0;
    color: var(--gf-coral, #B8391F);
    font-weight: 700;
}

.wz-novoice {
    display: flex;
    flex-direction: column;
    gap: 0.6em;
}

.wz-footer {
    display: flex;
    gap: 0.8em;
    justify-content: flex-end;
    flex-wrap: wrap;
    padding-top: 0.6em;
    border-top: 2px solid var(--gf-linha, #D3E0D0);
}

.wz-btn {
    margin: 0;
    min-height: 3.2em;
    min-width: 9em;
    text-transform: none;
    letter-spacing: 0;
    font-size: 1.05em;
}

.wz-primary {
    background-color: var(--gf-mata, #1D6B35);
    border-color: var(--gf-mata, #1D6B35);
    color: #FFFFFF;
}

.wz-primary:hover,
.wz-primary:focus {
    background-color: var(--gf-mata-escuro, #175A2C);
    border-color: var(--gf-tinta, #14261A);
    color: #FFFFFF;
}
</style>
